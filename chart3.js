document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 50, bottom: 50, left: 80 },
            width = 1200,
            height = 700;

        data.forEach(d => {
            d["Thành tiền"] = +d["Thành tiền"] || 0;
            d["SL"] = +d["SL"] || 0;
            d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]);
        });

        const revenueByMonth = d3.rollups(
            data,
            v => ({
                value: d3.sum(v, d => d["Thành tiền"]),
                quantity: d3.sum(v, d => d["SL"])
            }),
            d => d3.timeFormat("%m")(d["Thời gian tạo đơn"])
        ).map(([month, obj]) => ({ month: `Tháng ${month}`, value: obj.value, quantity: obj.quantity }));

        revenueByMonth.sort((a, b) => parseInt(a.month.split(" ")[1]) - parseInt(b.month.split(" ")[1]));

        const svg = d3.select("#chart3")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const x = d3.scaleBand()
            .domain(revenueByMonth.map(d => d.month))
            .range([margin.left, width - margin.right])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(revenueByMonth, d => d.value) * 1.2])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // 🌈 Màu sắc giống như trong ảnh
        const customColors = [
            "#6b6256", "#c6b8af", "#d78ba4", "#ffb3c1", "#9b5c8f", "#db9acb",
            "#a87c50", "#d5b49d", "#4d9391", "#7fbac0", "#d9422a", "#ff9c87"
        ];

        // Vẽ cột với màu tùy chỉnh
        svg.selectAll(".bar")
            .data(revenueByMonth)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.month))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - margin.bottom - y(d.value))
            .attr("fill", (d, i) => customColors[i % customColors.length]);

        // Nhãn số liệu trên cột
        svg.selectAll(".label")
            .data(revenueByMonth)
            .enter()
            .append("text")
            .attr("x", d => x(d.month) + x.bandwidth() / 2)
            .attr("y", d => y(d.value) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "black")
            .text(d => `${Math.round(d.value / 1e6)} triệu VNĐ`);

        // Trục X
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .style("font-size", "11px");

        // Trục Y
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(8).tickFormat(d => `${(d / 1e6).toFixed(0)}M`))
            .style("font-size", "11px");

        // Tiêu đề
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Doanh số bán hàng theo Tháng");

    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
