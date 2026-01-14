import { AlertCircle, Check, Loader2, LogOut, QrCode, RefreshCw, Shield, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'http://192.168.1.7:8080/riff/api/auth';

interface LoginForm {
  phone: string;
  password: string;
  deviceId: string;
  deviceType: string;
  deviceName: string;
}

interface QRData {
  qrId: string;
  qrData: string;
  expiresAt: string;
  status: string;
}

interface ApiResponse<T> {
  result?: T;
  message?: string;
  code?: number;
}

interface AuthenticationResponse {
  token: string;
  refreshToken: string;
  authenticated: boolean;
}

interface QRStatusResponse {
  qrId: string;
  status: 'PENDING' | 'SCANNED' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  sessionToken?: string;
  refreshToken?: string;
  message?: string;
}

const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);
  }, []);

  const login = async (loginForm: LoginForm) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data: ApiResponse<AuthenticationResponse> = await response.json();

      if (response.ok && data.result) {
        setToken(data.result.token);
        localStorage.setItem('token', data.result.token);
        localStorage.setItem('refreshToken', data.result.refreshToken);
        setSuccess(data.message || 'Login successful!');
        return true;
      } else {
        setError(data.message || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('Connection error: ' + (err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (deviceId: string) => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ token, deviceId })
      });

      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setSuccess('Logged out successfully');
    } catch (err) {
      setError('Logout failed: ' + (err as Error).message);
    }
  };

  const introspect = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/introspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data: ApiResponse<{ valid: boolean }> = await response.json();
      if (data.result) {
        setSuccess(`Token is ${data.result.valid ? 'VALID ✓' : 'INVALID ✗'}`);
      }
    } catch (err) {
      setError('Introspect failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async (deviceId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceId })
      });

      const data: ApiResponse<AuthenticationResponse> = await response.json();

      if (response.ok && data.result) {
        setToken(data.result.token);
        localStorage.setItem('token', data.result.token);
        localStorage.setItem('refreshToken', data.result.refreshToken);
        setSuccess(data.message || 'Token refreshed');
      } else {
        setError(data.message || 'Refresh failed');
      }
    } catch (err) {
      setError('Refresh failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { token, setToken, loading, error, success, setError, setSuccess, login, logout, introspect, refresh };
};

const useQRLogin = (onSuccess: (token: string, refreshToken: string) => void) => {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [qrStatus, setQrStatus] = useState('');
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateQR = async (deviceId: string) => {
    setLoading(true);
    setError('');
    setQrData(null);
    setQrStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/qr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, deviceType: 'DESKTOP', deviceInfo: navigator.userAgent })
      });

      const data: ApiResponse<QRData> = await response.json();

      if (response.ok && data.result) {
        setQrData(data.result);
        setSuccess('QR code generated! Scan with mobile app');
        startPolling(data.result.qrId);
      } else {
        setError(data.message || 'Failed to generate QR');
      }
    } catch (err) {
      setError('Connection error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (qrId: string) => {
    setPolling(true);

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/qr/status/${qrId}`);
        const data: ApiResponse<QRStatusResponse> = await response.json();

        if (data.result) {
          setQrStatus(data.result.status);

          if (data.result.status === 'CONFIRMED' && data.result.sessionToken) {
            clearInterval(interval);
            setPolling(false);
            onSuccess(data.result.sessionToken, data.result.refreshToken || '');
            setSuccess(data.result.message || 'QR Login successful!');
          } else if (data.result.status === 'EXPIRED' || data.result.status === 'CANCELLED') {
            clearInterval(interval);
            setPolling(false);
            setError(data.result.message || 'QR code ' + data.result.status.toLowerCase());
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 180000);
  };

  const cancelQR = async () => {
    if (qrData) {
      try {
        await fetch(`${API_BASE_URL}/qr/${qrData.qrId}`, { method: 'DELETE' });
        setQrData(null);
        setQrStatus('');
        setPolling(false);
        setSuccess('QR code cancelled');
      } catch (err) {
        setError('Failed to cancel QR');
      }
    }
  };

  return { qrData, qrStatus, polling, loading, error, success, setError, setSuccess, generateQR, cancelQR };
};

const Alert: React.FC<{ type: 'error' | 'success'; message: string; onClose: () => void }> = ({ type, message, onClose }) => (
  <div className={`mb-4 p-4 rounded-lg border flex items-start gap-3 ${type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
    {type === 'error' ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /> : <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
    <div className="flex-1">
      <p className={`font-medium ${type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
        {type === 'error' ? 'Error' : 'Success'}
      </p>
      <p className={`text-sm ${type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
    </div>
    <button onClick={onClose} className={type === 'error' ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}>
      <X className="w-5 h-5" />
    </button>
  </div>
);

// Component để hiển thị QR Code thực sự
const QRCodeDisplay: React.FC<{ data: string }> = ({ data }) => {
  const [qrImageUrl, setQrImageUrl] = useState('');

  useEffect(() => {
    // Sử dụng API miễn phí để tạo QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
    setQrImageUrl(qrUrl);
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-4 border-indigo-500">
      {qrImageUrl ? (
        <img
          src={qrImageUrl}
          alt="QR Code"
          className="w-72 h-72"
          onError={(e) => {
            console.error('QR Code failed to load');
            // Fallback sang Google Charts API nếu API đầu tiên lỗi
            e.currentTarget.src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(data)}`;
          }}
        />
      ) : (
        <div className="w-72 h-72 flex items-center justify-center bg-gray-100 rounded">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
};

const LoginTab: React.FC<{
  loginForm: LoginForm;
  setLoginForm: (form: LoginForm) => void;
  onLogin: () => void;
  loading: boolean;
}> = ({ loginForm, setLoginForm, onLogin, loading }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800">Phone Login</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <input
          type="tel"
          value={loginForm.phone}
          onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && !loading && onLogin()}
          placeholder="0912345678"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input
          type="password"
          value={loginForm.password}
          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && !loading && onLogin()}
          placeholder="Enter password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={onLogin}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Logging in...</> : 'Login'}
      </button>
    </div>
    <div className="pt-4 border-t">
      <p className="text-sm text-gray-600 mb-2 font-medium">📝 Test Credentials:</p>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="space-y-1 font-mono text-sm">
          <p className="text-gray-700">Phone: <span className="text-blue-600 font-semibold">0912345678</span></p>
          <p className="text-gray-700">Password: <span className="text-blue-600 font-semibold">password123</span></p>
        </div>
      </div>
    </div>
  </div>
);

const QRTab: React.FC<{
  qrData: QRData | null;
  qrStatus: string;
  polling: boolean;
  loading: boolean;
  onGenerate: () => void;
  onCancel: () => void;
}> = ({ qrData, qrStatus, polling, loading, onGenerate, onCancel }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">QR Code Login</h2>
      <p className="text-gray-600 mt-1">Generate a QR code and scan it with your mobile app</p>
    </div>

    {!qrData ? (
      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><QrCode className="w-5 h-5" /> Generate QR Code</>}
      </button>
    ) : (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-8 flex flex-col items-center">
          {/* Hiển thị QR Code thực sự thay vì icon */}
          <QRCodeDisplay data={qrData.qrData} />

          <div className="w-full max-w-md space-y-3 mt-6">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">QR ID:</p>
              <p className="font-mono text-sm text-gray-800 break-all">{qrData.qrId}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">QR Data:</p>
              <p className="font-mono text-xs text-gray-600 break-all">{qrData.qrData}</p>
            </div>

            <div className="flex items-center justify-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
              <div className={`w-3 h-3 rounded-full ${polling ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className={`text-sm font-semibold ${qrStatus === 'SCANNED' ? 'text-yellow-600' :
                  qrStatus === 'CONFIRMED' ? 'text-green-600' :
                    qrStatus === 'EXPIRED' ? 'text-red-600' :
                      'text-gray-700'
                }`}>
                Status: {qrStatus || 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onGenerate} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
            🔄 Regenerate
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
            ✕ Cancel
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-semibold mb-3 flex items-center gap-2">
            <span>📱</span> How to scan:
          </p>
          <ol className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2"><span className="font-semibold">1.</span><span>Open the mobile app and login</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold">2.</span><span>Tap <strong>Scan QR</strong> tab</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold">3.</span><span>Point camera at this QR code</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold">4.</span><span>Confirm login on mobile</span></li>
          </ol>
        </div>
      </div>
    )}
  </div>
);

const ProfileTab: React.FC<{
  token: string | null;
  loading: boolean;
  onIntrospect: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}> = ({ token, loading, onIntrospect, onRefresh, onLogout }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>

    {token ? (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-green-800 font-bold text-lg">Authenticated</p>
              <p className="text-green-600 text-sm">Session is active</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-100">
            <p className="text-xs text-gray-500 mb-2">Access Token:</p>
            <p className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-2 rounded border border-gray-200">
              {token.substring(0, 100)}...
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onIntrospect} disabled={loading} className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Verify Token
          </button>
          <button onClick={onRefresh} disabled={loading} className="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh Token
          </button>
        </div>

        <button onClick={onLogout} className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    ) : (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">Not authenticated</p>
        <p className="text-gray-500 text-sm mt-1">Please login first</p>
      </div>
    )}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'login' | 'qr' | 'profile'>('login');
  const [loginForm, setLoginForm] = useState<LoginForm>({
    phone: '',
    password: '',
    deviceId: 'web-' + Math.random().toString(36).substr(2, 9),
    deviceType: 'DESKTOP',
    deviceName: 'Chrome Browser'
  });

  const auth = useAuth();
  const qr = useQRLogin((token, refreshToken) => {
    auth.setToken(token);
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setActiveTab('profile');
  });

  useEffect(() => {
    if (auth.token) setActiveTab('profile');
  }, [auth.token]);

  const handleLogin = async () => {
    const success = await auth.login(loginForm);
    if (success) setActiveTab('profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h1 className="text-3xl font-bold text-white">OTT Auth - Web QR Login</h1>
            <p className="text-blue-100 mt-2">Scan QR with mobile app to login instantly</p>
          </div>

          <div className="flex border-b">
            {(['login', 'qr', 'profile'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {tab === 'login' && '🔐 Login'}
                {tab === 'qr' && '📱 QR Login'}
                {tab === 'profile' && '👤 Profile'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {auth.error && <Alert type="error" message={auth.error} onClose={() => auth.setError('')} />}
            {auth.success && <Alert type="success" message={auth.success} onClose={() => auth.setSuccess('')} />}
            {qr.error && <Alert type="error" message={qr.error} onClose={() => qr.setError('')} />}
            {qr.success && <Alert type="success" message={qr.success} onClose={() => qr.setSuccess('')} />}

            {activeTab === 'login' && <LoginTab loginForm={loginForm} setLoginForm={setLoginForm} onLogin={handleLogin} loading={auth.loading} />}
            {activeTab === 'qr' && <QRTab {...qr} onGenerate={() => qr.generateQR(loginForm.deviceId)} />}
            {activeTab === 'profile' && <ProfileTab token={auth.token} loading={auth.loading} onIntrospect={auth.introspect} onRefresh={() => auth.refresh(loginForm.deviceId)} onLogout={() => auth.logout(loginForm.deviceId)} />}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 font-medium mb-2">🔧 System Info:</p>
          <div className="space-y-1 text-xs text-gray-500 font-mono">
            <p>API: <span className="text-blue-600">{API_BASE_URL}</span></p>
            <p>Device ID: <span className="text-blue-600">{loginForm.deviceId}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}