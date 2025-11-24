# Kế hoạch Kiểm Thử Theo Giai Đoạn (Stagewise Test) cho Hệ Thống Theo Dõi Vị Trí

## Giai Đoạn 1: Xác Định Phạm Vi và Kịch Bản Kiểm Thử

### Mục tiêu:
- Xác định toàn bộ phạm vi chức năng cần kiểm thử
- Tạo ra các kịch bản kiểm thử chi tiết cho từng chức năng
- Xác định tiêu chí chấp nhận (acceptance criteria) cho từng kiểm thử

### Nội dung:
- Quét qua toàn bộ mã nguồn và tài liệu hệ thống
- Xác định tất cả các thành phần chức năng: API, cơ sở dữ liệu, giao diện người dùng
- Phân loại các chức năng theo mức độ quan trọng (critical, important, nice-to-have)
- Tạo danh sách kịch bản kiểm thử cho từng chức năng

## Giai Đoạn 2: Kiểm Thử Đơn Vị (Unit Test)

### Mục tiêu:
- Kiểm tra các thành phần độc lập (functions, modules)
- Đảm bảo mỗi unit hoạt động đúng logic riêng biệt
- Phát hiện lỗi sớm trong quá trình phát triển

### Nội dung kiểm thử:
- Kiểm tra hàm mã hóa/giải mã trong encryption.js
- Kiểm tra hàm kết nối và truy vấn cơ sở dữ liệu trong neon-db.js
- Kiểm tra hàm xử lý IP và thông tin địa lý trong ipinfo.js
- Kiểm tra hàm quản lý lưu trữ tạm trong tempStorage.js
- Mỗi hàm phải có ít nhất 80% coverage

## Giai Đoạn 3: Kiểm Thử Tích Hợp (Integration Test)

### Mục tiêu:
- Kiểm tra sự tương tác giữa các thành phần
- Đảm bảo API hoạt động chính xác với cơ sở dữ liệu
- Kiểm tra luồng dữ liệu từ đầu tới cuối

### Nội dung kiểm thử:
- Kiểm tra API endpoints: /api/dashboard-stats, /api/clicks
- Kiểm tra quá trình lưu và truy xuất dữ liệu vào cơ sở dữ liệu Neon PostgreSQL
- Kiểm tra tích hợp giữa server.js và các module utils
- Kiểm tra xử lý lỗi và ngoại lệ trong quá trình tích hợp

## Giai Đoạn 4: Kiểm Thử Chức Năng (Functional Test)

### Mục tiêu:
- Kiểm tra chức năng đầy đủ của hệ thống từ góc nhìn người dùng
- Đảm bảo tất cả các chức năng theo yêu cầu hoạt động đúng
- Kiểm tra giao diện người dùng và trải nghiệm sử dụng

### Nội dung kiểm thử:
- Kiểm tra dashboard admin: thống kê, bộ lọc, bảng dữ liệu
- Kiểm tra chức năng hiển thị bản đồ Leaflet: hiển thị marker, popup, điều khiển
- Kiểm tra chức năng phân trang và lọc dữ liệu
- Kiểm tra phản hồi giao diện khi tải dữ liệu, loading state
- Kiểm tra tương thích trên các trình duyệt phổ biến

## Giai Đoạn 5: Kiểm Thử Hiệu Suất (Performance Test)

### Mục tiêu:
- Kiểm tra tốc độ phản hồi của hệ thống dưới tải
- Đảm bảo hệ thống hoạt động ổn định với lượng dữ liệu lớn
- Xác định điểm chết và khả năng chịu tải tối đa

### Nội dung kiểm thử:
- Kiểm tra thời gian tải trang admin với 1000+ bản ghi
- Kiểm tra thời gian phản hồi API với tải đồng thời từ 10-100 yêu cầu
- Kiểm tra hiệu suất hiển thị bản đồ với 100+ markers
- Kiểm tra sử dụng tài nguyên hệ thống (CPU, memory, network)

## Giai Đoạn 6: Kiểm Thử Hồi Quy (Regression Test)

### Mục tiêu:
- Đảm bảo rằng các thay đổi mới không làm hỏng chức năng hiện có
- Kiểm tra lại tất cả các chức năng quan trọng sau mỗi thay đổi lớn
- Phát hiện sớm các lỗi phát sinh do thay đổi mã

### Nội dung kiểm thử:
- Chạy lại toàn bộ bộ kiểm thử chức năng sau mỗi lần thay đổi lớn
- Kiểm tra các đường hotfix không làm hỏng chức năng khác
- Xác định các vùng ảnh hưởng của thay đổi và tập trung kiểm thử vào đó

## Giai Đoạn 7: Tổng Hợp Kết Quả Kiểm Thử

### Mục tiêu:
- Đánh giá chất lượng hệ thống dựa trên kết quả kiểm thử
- Xác định các vấn đề cần khắc phục trước khi triển khai
- Tạo báo cáo chi tiết về kết quả kiểm thử

### Nội dung:
- Tính toán tỷ lệ thành công/failure của từng loại kiểm thử
- Xếp hạng độ nghiêm trọng của các lỗi phát hiện
- Tạo danh sách khắc phục ưu tiên
- Đưa ra recommendation cho quá trình phát triển tiếp theo

## Công cụ Kiểm Thử Sử Dụng

- Unit Test: Jest
- Integration Test: Supertest cho API
- Functional Test: Cypress cho giao diện
- Performance Test: K6, Lighthouse
- Báo cáo: Jest Reporter, Cypress Dashboard

## Thời Gian Dự Kiến

- Giai Đoạn 1: 1 ngày
- Giai Đoạn 2: 2 ngày
- Giai Đoạn 3: 2 ngày
- Giai Đoạn 4: 3 ngày
- Giai Đoạn 5: 2 ngày
- Giai Đoạn 6: 1 ngày
- Giai Đoạn 7: 1 ngày
- Tổng: 12 ngày