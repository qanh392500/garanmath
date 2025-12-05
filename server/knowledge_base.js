// server/knowledge_base.js

export const KNOWLEDGE_BASE = [
    {
        cmd: "Midpoint(Point A, Point B)",
        desc: "Lấy trung điểm của đoạn thẳng hoặc hai điểm, điểm chính giữa",
        ex: "M = Midpoint(S, C)"
    },
    {
        cmd: "Segment(Point A, Point B)",
        desc: "Vẽ đoạn thẳng, cạnh nối hai điểm, đường thẳng giới hạn bởi hai điểm",
        ex: "Segment(S, H)"
    },
    {
        cmd: "Polygon(Point A, Point B, Point C...)",
        desc: "Vẽ đa giác, mặt phẳng, tam giác, tứ giác, hình chữ nhật, hình vuông, đáy của hình khối",
        ex: "Polygon(A, B, C)"
    },
    {
        cmd: "Intersect(Object A, Object B)",
        desc: "Tìm giao điểm của đường thẳng và mặt phẳng, hoặc hai đường thẳng",
        ex: "I = Intersect(lineSC, planeABCD)"
    },
    {
        cmd: "PerpendicularLine(Point A, Plane/Line)",
        desc: "Vẽ đường thẳng đi qua điểm và vuông góc với mặt phẳng hoặc đường thẳng, đường cao, quan hệ vuông góc",
        ex: "h = PerpendicularLine(S, Polygon(A,B,C))"
    },
    {
        cmd: "Centroid(Polygon)",
        desc: "Tìm trọng tâm của tam giác hoặc đa giác",
        ex: "G = Centroid(Polygon(A,B,C))"
    },
    {
        cmd: "Pyramid(Polygon base, Point top)",
        desc: "Vẽ hình chóp, khối chóp từ mặt đáy và đỉnh",
        ex: "Pyramid(poly1, S)"
    },
    {
        cmd: "Prism(Polygon base, Point top)",
        desc: "Vẽ hình lăng trụ, khối lăng trụ đứng",
        ex: "Prism(poly1, A')"
    },
    {
        cmd: "Vector(Point Start, Point End)",
        desc: "Vẽ vector từ điểm đầu đến điểm cuối",
        ex: "u = Vector(A, B)"
    },
    {
        cmd: "Sphere(Point Center, Radius)",
        desc: "Vẽ mặt cầu tâm Center bán kính Radius",
        ex: "s = Sphere(O, 5)"
    },
    {
        cmd: "Circle(Point Center, Radius, Plane)",
        desc: "Vẽ đường tròn tâm Center, bán kính Radius, nằm trên mặt phẳng Plane (tùy chọn)",
        ex: "c = Circle(O, 3, xOyPlane)"
    },
    {
        cmd: "Distance(Point A, Object B)",
        desc: "Tính khoảng cách từ điểm A đến đối tượng B (điểm, đường, mặt)",
        ex: "d = Distance(S, Polygon(A,B,C))"
    },
    {
        cmd: "Angle(Point A, Point B, Point C)",
        desc: "Tính góc giữa 3 điểm (đỉnh là B)",
        ex: "alpha = Angle(A, B, C)"
    },
    {
        cmd: "Volume(Solid)",
        desc: "Tính thể tích của khối đa diện (hình chóp, lăng trụ, cầu...)",
        ex: "V = Volume(pyramid)"
    },
    {
        cmd: "Rename(Object, Name)",
        desc: "Đổi tên đối tượng (Lưu ý: Tên phải là duy nhất, không trùng lặp)",
        ex: "Rename(A, \"M\")"
    },
    {
        cmd: "SetColor(Object, Red, Green, Blue)",
        desc: "Đặt màu cho đối tượng (RGB từ 0-1 hoặc 0-255 tùy phiên bản, nên dùng tên màu tiếng Anh nếu có thể)",
        ex: "SetColor(A, 1, 0, 0)"
    },

    // --- CÁC LỆNH TẠO ĐỐI TƯỢNG CĂN BẢN (Bổ sung) ---
    {
        cmd: "Point(Coordinates)",
        desc: "Tạo điểm tại tọa độ (x, y, z)",
        ex: "A = (1, 2, 3)"
    },
    {
        cmd: "Point(Object)",
        desc: "Tạo điểm nằm trên một đối tượng (đường thẳng, mặt phẳng)",
        ex: "M = Point(segmentAB)"
    },
    {
        cmd: "Ray(StartPoint, PointOnRay)",
        desc: "Vẽ tia (nửa đường thẳng) bắt đầu từ điểm",
        ex: "r = Ray(A, B)"
    },
    {
        cmd: "ParallelLine(Point, Line)",
        desc: "Vẽ đường thẳng đi qua điểm và song song với đường thẳng khác, quan hệ song song",
        ex: "d = ParallelLine(A, lineBC)"
    },

    // --- CÁC LỆNH QUẢN LÝ HIỂN THỊ (Dựa trên tài liệu API) --- S = (O.x, O.y, a)
    {
        cmd: "Delete(Object)",
        desc: "Xóa đối tượng khỏi bản vẽ ",
        ex: "Delete(A)"
    },
    {
        cmd: "ShowLabel(Object, Boolean)",
        desc: "Ẩn hoặc hiện tên (nhãn) của đối tượng ",
        ex: "ShowLabel(A, false)"
    },
    {
        cmd: "SetVisibleInView(Object, ViewNumber, Boolean)",
        desc: "Ẩn hoặc hiện đối tượng ",
        ex: "SetVisibleInView(planeP, -1, false)"
    },
    {
        cmd: "SetFixed(Object, Boolean)",
        desc: "Cố định đối tượng, không cho phép dùng chuột di chuyển ",
        ex: "SetFixed(A, true)"
    },
    {
        cmd: "SetTrace(Object, Boolean)",
        desc: "Bật/Tắt chế độ để lại vết khi di chuyển",
        ex: "SetTrace(PointM, true)"
    },

    // --- CÁC LỆNH ĐỊNH DẠNG (STYLE) (Dựa trên tài liệu API) ---
    {
        cmd: "SetLineThickness(Object, Number)",
        desc: "Độ dày nét vẽ (1 đến 13). BẮT BUỘC phải có tham số Number (ví dụ: 5).",
        ex: "SetLineThickness(segmentAB, 5)"
    },
    {
        cmd: "SetLineStyle(Object, Number)",
        desc: "Kiểu nét vẽ (0: Liền, 1: Đứt đoạn, 2: Chấm...). BẮT BUỘC phải có tham số Number.",
        ex: "SetLineStyle(lineD, 1)"
    },
    {
        cmd: "SetPointStyle(Object, Number)",
        desc: "Kiểu hiển thị điểm (0: Tròn đặc, 1: Chéo, 2: Tròn rỗng...). BẮT BUỘC phải có tham số Number.",
        ex: "SetPointStyle(A, 2)"
    },
    {
        cmd: "SetPointSize(Object, Number)",
        desc: "Kích thước điểm (1 đến 9). BẮT BUỘC phải có tham số Number (ví dụ: 5).",
        ex: "SetPointSize(A, 5)"
    },
    {
        cmd: "SetFilling(Object, Number)",
        desc: "Độ đậm màu tô (Opacity) từ 0 đến 1",
        ex: "SetFilling(poly1, 0.25)"
    },
    {
        cmd: "SetCaption(Object, Text)",
        desc: "Đặt chú thích hiển thị thay cho tên đối tượng",
        ex: "SetCaption(A, \"Điểm gốc\")"
    }
];
