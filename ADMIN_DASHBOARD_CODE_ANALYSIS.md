# Admin Dashboard Module — Tổng hợp & Phân tích Code

Tài liệu này tổng hợp các phần code đã được thêm/cập nhật để tích hợp Admin Dashboard vào project `ott-frontend-web` (React + TypeScript).

---

## 1) Mục tiêu triển khai

- Thêm module Admin tách biệt với luồng người dùng cuối.
- Tổ chức đúng cấu trúc folder hiện có:
  - `src/pages/admin`
  - `src/components/admin`
  - `src/services`
  - `src/interfaces`
  - `src/routers`
- Kết nối dữ liệu từ `analytic-service` (`http://localhost:8090`).
- Bổ sung bộ lọc thời gian, biểu đồ Recharts và empty state để dashboard có dữ liệu “đỡ trống trải”.

---

## 2) Danh sách file đã tạo

## 2.1 Pages

1. `src/pages/admin/Dashboard.tsx`
2. `src/pages/admin/ContentModeration.tsx`
3. `src/pages/admin/UserManagement.tsx`
4. `src/components/admin/Header.tsx`
5. `src/components/admin/EmptyState.tsx`

## 2.2 Components

6. `src/components/admin/AdminLayout.tsx`
7. `src/components/admin/Sidebar.tsx`
8. `src/components/admin/StatCard.tsx`
9. `src/components/admin/AdminTable.tsx`
10. `src/components/admin/Charts.tsx`
11. `src/components/admin/AdminAnalyticsContext.tsx`

## 2.3 Services & Interfaces

12. `src/services/adminService.ts`
13. `src/interfaces/admin.interface.ts`

---

## 3) Danh sách file đã cập nhật

1. `src/routers/routes.tsx`
   - Thêm route admin:
     - `/admin`
     - `/admin/moderation`
     - `/admin/users`
   - Thêm constants:
     - `ROUTE_PATHS.ADMIN`
     - `ROUTE_PATHS.ADMIN_MODERATION`
     - `ROUTE_PATHS.ADMIN_USERS`

2. `src/App.tsx`
   - Tách logic render route admin ra khỏi `MainLayout` user route.
   - Dùng `useLocation()` để xác định `isAdminRoute`.
   - Nếu path bắt đầu bằng `/admin` thì render nhánh admin routes riêng.

3. `src/components/admin/AdminLayout.tsx`
   - Bọc admin pages trong `AdminAnalyticsProvider`.
   - Gắn `Header` có dropdown lọc thời gian.

4. `src/components/admin/AdminAnalyticsContext.tsx`
   - Cung cấp state `timeRange` toàn cục cho toàn bộ admin pages.

5. `src/components/admin/Charts.tsx`
   - Thay progress bar bằng `Recharts`.
   - Hỗ trợ `PieChart` cho phân bố loại tin nhắn.
   - Hỗ trợ `AreaChart` cho bài viết/tin nhắn theo thời gian.

6. `src/components/admin/AdminTable.tsx`
   - Tự hiển thị `EmptyState` khi không có dữ liệu.

7. `src/components/admin/EmptyState.tsx`
   - Empty state có icon minh hoạ nhẹ nhàng và nội dung tiếng Việt.

8. `src/interfaces/index.ts`
   - Re-export admin interfaces.

9. `src/services/index.ts`
   - Export `adminService`.

---

## 4) Phân tích kiến trúc module Admin

## 4.1 Layout pattern

`AdminLayout` đóng vai trò shell cho toàn bộ admin pages:

- Sidebar riêng (`components/admin/Sidebar`)
- Header riêng với dropdown lọc thời gian
- Content area có animation (`framer-motion`)
- Hỗ trợ cả 2 cách render:
  - Qua `children`
  - Qua `<Outlet />`

> Hiện tại route admin đang dùng kiểu truyền `children` trực tiếp từ `routes.tsx`.

## 4.2 Routing strategy

- Module admin dùng route prefix `/admin` để tách namespace rõ ràng.
- Tránh dùng `MainLayout` của user pages khi vào admin pages.
- `App.tsx` xử lý tách nhánh route theo pathname runtime.

Ưu điểm:

- Không phá route user cũ.
- Dễ mở rộng thêm admin pages trong tương lai.

Trade-off:

- Có logic filter route trong `App.tsx`, cần giữ đồng bộ khi thêm routes mới.

## 4.3 Data access layer

`adminService.ts` là abstraction duy nhất để gọi analytic API:

- `getOverview(timeRange)`
- `getRecentUsers(timeRange)`
- `getMessageTypes(timeRange)`
- `getDailyActivity(timeRange)`
- `getDailyPosts(timeRange)`

Contract API hiện tại của service analytics:

- `GET /api/v1/admin/analytics/overview?timeRange=...`
- `GET /api/v1/admin/analytics/users/recent?timeRange=...`
- `GET /api/v1/admin/analytics/messages/types?timeRange=...`
- `GET /api/v1/admin/analytics/social/activity/daily?timeRange=...`
- `GET /api/v1/admin/analytics/social/posts/daily?timeRange=...` (legacy)

Giá trị `timeRange` được hỗ trợ:

- `today`
- `last7Days`
- `last30Days`
- `allTime`

Điểm tốt:

- Tập trung API call tại 1 nơi.
- Generic helper `getJson<T>()` giảm duplicate code.

Điểm cần cải thiện:

- Base URL đang hardcode (`http://localhost:8090`), nên chuyển sang env (`VITE_API_BASE_URL`) để deploy linh hoạt.

## 4.4 Type system

`admin.interface.ts` định nghĩa model rõ cho admin analytics:

- `OverviewResponse`
- `UserSummary`
- `MessageTypesResponse`
- `DailyActivityPoint`
- `DailyPostPoint`
- `EventReport`
- `AdminNavItem`
- `TimeRange`

=> Giúp page/component không bị dùng `any`, dễ maintain khi backend contract thay đổi.

---

## 5) Phân tích theo từng page

## 5.1 `Dashboard.tsx`

Mục đích:

- Tổng quan hệ thống bằng stats + biểu đồ tỷ lệ message type.
- Dữ liệu được lọc theo `timeRange` từ Header.

Luồng dữ liệu:

1. `useEffect` gọi song song:
   - `adminService.getOverview(timeRange)`
   - `adminService.getMessageTypes(timeRange)`
2. Cập nhật state `overview`, `messageTypes`.
3. Dùng `useMemo` map sang `EventReport[]` cho component `Charts`.
4. Render:
   - 3 `StatCard` (users/messages/posts)
   - 1 Pie chart summary + 1 panel health.

API sử dụng:

- `/api/v1/admin/analytics/overview?timeRange=...`
- `/api/v1/admin/analytics/messages/types?timeRange=...`

## 5.2 `ContentModeration.tsx`

Mục đích:

- Theo dõi bài viết và tin nhắn theo thời gian.

Luồng:

1. Gọi `adminService.getDailyActivity(timeRange)`.
2. Render trực tiếp `DailyActivityPoint[]` bằng `Charts`.
3. Chart hiển thị area mượt với 2 series: bài viết và tin nhắn.

API sử dụng:

- `/api/v1/admin/analytics/social/activity/daily?timeRange=...`

## 5.3 `UserManagement.tsx`

Mục đích:

- Hiển thị danh sách user gần đây.
- Tự ẩn bảng cũ và hiển thị empty state nếu không có dữ liệu trong khoảng thời gian chọn.

Luồng:

1. Gọi `adminService.getRecentUsers(timeRange)`.
2. Render bảng qua `AdminTable` generic.

API sử dụng:

- `/api/v1/admin/analytics/users/recent?timeRange=...`

---

## 6) Phân tích component admin

## 6.1 `Sidebar.tsx`

- Dùng `NavLink` để active state theo route.
- Icon từ `lucide-react`.
- Điều hướng 3 tab chính admin.

## 6.2 `StatCard.tsx`

- Card hiển thị metric.
- Hover animation nhẹ bằng `framer-motion`.

## 6.3 `AdminTable.tsx`

- Generic component theo kiểu `T extends object`.
- Columns config-based giúp tái sử dụng.
- Đã chỉnh type để tương thích model cụ thể (`UserSummary`) mà không cần index signature.

## 6.4 `Charts.tsx`

- Đã chuyển sang `Recharts`.
- Hỗ trợ `PieChart` và `AreaChart`.
- Tự hiển thị `EmptyState` khi dữ liệu rỗng.

## 6.5 `Header.tsx`

- Dropdown lọc thời gian: Hôm nay / 7 ngày gần đây / 30 ngày gần đây / Tất cả thời gian.
- Cập nhật giá trị `timeRange` toàn cục qua context.
- Giá trị này được truyền trực tiếp xuống `adminService` khi gọi API.

## 6.6 `EmptyState.tsx`

- Dùng icon nhẹ nhàng và message tiếng Việt.
- Tái sử dụng cho cả bảng và biểu đồ.

---

## 7) Luồng dữ liệu tổng quát (end-to-end)

1. Admin vào `/admin` hoặc các sub-route.
2. `App.tsx` nhận diện admin route và render nhánh route admin.
3. `AdminLayout` cung cấp `timeRange` qua context.
4. Page gọi `adminService(timeRange)`.
5. `adminService` gọi API `analytic-service` trên cổng `8090` kèm query `timeRange`.
6. Dữ liệu response map vào interface typed.
7. Components render UI + animation + empty state nếu cần.

### API structure summary

```text
GET /api/v1/admin/analytics/overview?timeRange={today|last7Days|last30Days|allTime}
GET /api/v1/admin/analytics/users/recent?timeRange={today|last7Days|last30Days|allTime}
GET /api/v1/admin/analytics/messages/types?timeRange={today|last7Days|last30Days|allTime}
GET /api/v1/admin/analytics/social/activity/daily?timeRange={today|last7Days|last30Days|allTime}
GET /api/v1/admin/analytics/social/posts/daily?timeRange={today|last7Days|last30Days|allTime}
```

---

## 8) Các điểm kỹ thuật cần chú ý

1. **Không ghi đè `main.tsx`**: giữ nguyên theo yêu cầu.
2. **`App.tsx` có thay đổi**: là thay đổi cần thiết để tách layout admin/user.
3. **Build toàn repo** vẫn còn lỗi cũ ở module modal/social, không thuộc phạm vi admin module.
4. **Base URL hardcode**: nên chuyển env trước khi đưa staging/prod.
5. **`timeRange` backend** đã được thêm để hỗ trợ filter thật ở API.

---

## 9) Đề xuất cải tiến tiếp theo

1. Đổi `adminService` sang dùng env:
   - `const BASE = import.meta.env.VITE_ANALYTIC_API_BASE_URL`
2. Bổ sung loading/error UI cho từng page (không chỉ `console.error`).
3. Chuẩn hóa route admin bằng nested route + `<Outlet />` 100%.
4. Thêm unit test cho:
   - `adminService`
   - mapping data của `Dashboard.tsx`

---

## 10) Tóm tắt nhanh

Module Admin đã được tích hợp vào project hiện hữu theo đúng cấu trúc yêu cầu, bao gồm:

- 3 trang admin (`Dashboard`, `ContentModeration`, `UserManagement`)
- Layout/sidebar/components riêng cho admin
- Service + Interfaces typed cho analytics
- Route namespace `/admin` tách biệt user flow

Phần triển khai hiện phù hợp cho MVP, dễ mở rộng trong các bước tiếp theo.
