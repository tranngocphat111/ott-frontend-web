# OTT Frontend Web - AI Coding Agent Instructions

## Project Overview
**Stack**: React 19 + TypeScript + Vite + TailwindCSS + React Router v7  
**Domain**: Over-The-Top (OTT) streaming platform with multi-factor authentication, account management, and session control

## Build & Development Commands
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite build (dist/)
npm run lint     # ESLint check
npm run preview  # Preview production build locally
```

## Core Architecture Patterns

### 1. Authentication Context
Located in `src/context/AuthContext.tsx`:
- Manages user profile, login/logout, registration, token persistence
- Supports multiple auth methods: local login, Google OAuth, QR scanning
- 2FA handling with temporary tokens for step-up authentication
- Phone setup flow for new users or phone changes
- Response pattern: Returns `requires2FA`, `tempToken`, or `requiresPhoneSetup` based on auth state

**Key Methods**:
```typescript
login(phone, password, otpCode?)      // Returns 2FA/tempToken if needed
loginWithToken(token, refreshToken)   // Direct token-based login
register(phone, email, password, fullName, otp)
updateProfile(updates)                // Local state update
refreshUser()                          // Fetch fresh profile data
```

### 2. API Service Architecture
Located in `src/services/api/`:
- **client.ts**: Axios instance with auto-token-refresh interceptor (401 retry logic)
- Domain-specific services: `auth.api.ts`, `account.api.ts`, `profile.api.ts`, `otp.api.ts`, `qr.api.ts`, `session.api.ts`, `twoFactor.api.ts`
- Response format: `{ result: T | null, code: number, message: string }`
- All token management handled via localStorage (accessToken, refreshToken)

**Pattern**: Function-based API wrappers
```typescript
export const accountApi = {
  requestChangeEmail: (data) => apiClient.post('/account/email/change/request', data),
  changeEmail: (data) => apiClient.post('/account/email/change/verify', data),
  // ...
};
```

### 3. Routing Architecture
**File**: `src/routers/AppRouter.tsx`
- **PrivateRoute**: Checks `isAuthenticated` + handles loading state
- **PublicRoute**: Redirects authenticated users away from login/register
- Routes pages to pages (no layouts - flat structure)
- Google callback route accessible without auth (handles token setup)
- Phone setup accessible during auth flow (before full authentication)

### 4. Configuration & Environment
Located in `src/configuration/api.ts`:
- API_CONFIG: BASE_URL, TIMEOUT, default headers from `import.meta.env`
- GOOGLE_CONFIG: CLIENT_ID, REDIRECT_URI for OAuth flow
- API_ENDPOINTS: All endpoint paths as constants/functions (e.g., `QR_STATUS(qrId)`)

**Environment Variables**:
```
VITE_API_URL          # Backend base URL
VITE_GOOGLE_CLIENT_ID # Google OAuth client ID
VITE_FRONTEND_URL     # Frontend URL for callbacks
```

### 5. Multi-Account Session Management
- Users can link/unlink external accounts (Google, QR sessions)
- Session tracking for device/location awareness
- QR login flow for mobile → web authentication
- Sessions page shows active devices and allows remote logout

### 6. Security Features
- 2FA with OTP support
- Password change with current password verification
- Email/Phone changes require OTP verification
- Account deletion with confirmation
- Device information tracking for session anomaly detection

### 7. UI & Styling
- **TailwindCSS v4**: No config file needed (uses default), dark mode support
- **Icons**: lucide-react for navigation and status indicators
- **QR Code**: qrcode.react library for QR generation/scanning
- **Loading states**: Animated spinner components for async operations

## Key File Locations & Patterns

| Task | File | Pattern |
|------|------|---------|
| Add new account setting page | `src/pages/[Feature]Page.tsx` | Use `useAuth()` hook, call `accountApi.[method]()`, wrap with `<PrivateRoute>` |
| Add API endpoint | `src/services/api/[domain].api.ts` | Export API methods, add endpoint to `API_ENDPOINTS` config |
| Auth flow with 2FA | `src/context/AuthContext.tsx` | Check `requires2FA` response, redirect to 2FA page with tempToken |
| Session/device management | `src/pages/SessionsPage.tsx` | Use `sessionApi`, display device info, allow session revocation |
| OTP input component | `src/components/` | Use refs array pattern for 6-digit OTP input fields |

## Important Conventions

1. **Token Refresh Flow**: Client automatically retries failed 401 requests after refreshing token
   ```typescript
   // In client.ts: 401 → refresh token → retry original request
   ```

2. **Auth State Initialization**: Check localStorage on app load; set `isLoading: false` after token validation

3. **Multi-step auth flows**: Use context state + temporary tokens instead of route params
   ```typescript
   // Example: login → 2FA required → pass tempToken to 2FA page
   ```

4. **OTP Patterns**: 6-digit numeric input, auto-focus to next field, handle paste

5. **Google OAuth Integration**: Redirect to Google, handle callback, extract token, call `loginWithToken()`

6. **Response Handling**: Always check `response.result` and catch thrown errors from API

## Testing & Quality
- ESLint config: `eslint.config.js`
- Type checking: `tsc -b` before build
- React 19 strict mode enabled

## Common Tasks
- **Protect a route**: Wrap page with `<PrivateRoute>` component
- **Call API with auth**: Use appropriate `*Api.method()`, errors auto-handled with interceptor
- **Update user profile locally**: Call `updateProfile()` from AuthContext
- **Handle 2FA redirect**: Check response for `requires2FA`, store `tempToken` in state
- **Parse query params**: Use `useSearchParams()` from react-router for callback handling
