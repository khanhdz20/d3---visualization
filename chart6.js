document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 40, bottom: 100, left: 50 },
            width = 1100 - margin.left - margin.right,
            height = 350 - margin.top - margin.bottom;

        data.forEach(d => {
            d["Thành tiền"] = isNaN(+d["Thành tiền"]) ? 0 : +d["Thành tiền"];
            d["SL"] = isNaN(+d["SL"]) ? 0 : +d["SL"];
            d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]) || null;
        });

        const validData = data.filter(d => d["Thời gian tạo đơn"] !== null);

        const hourData = validData.map(d => {
            const hour = d["Thời gian tạo đơn"].getHours();
            return {
                "Khung giờ": `${hour.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:59`,
                "Ngày tạo đơn": d3.timeFormat("%Y-%m-%d")(d["Thời gian tạo đơn"]),
                "Thành tiền": d["Thành tiền"],
                "SL": d["SL"]
            };
        });

        const aggregatedData = Array.from(
            d3.group(hourData, d => d["Khung giờ"]),
            ([key, values]) => ({
                "Khung giờ": key,
                "Thành tiền": d3.sum(values, d => d["Thành tiền"]),
                "SL": d3.sum(values, d => d["SL"]),
                "Ngày tạo đơn": new Set(values.map(d => d["Ngày tạo đơn"])).size
            })
        ).map(d => ({
            ...d,
            "Doanh số bán TB": d["Ngày tạo đơn"] > 0 ? Math.round(d["Thành tiền"] / d["Ngày tạo đơn"]) : 0,
            "Số lượng bán TB": d["SL"]
        }));

        aggregatedData.sort((a, b) => parseInt(a["Khung giờ"].split(':')[0]) - parseInt(b["Khung giờ"].split(':')[0]));

        const svg = d3.select("#chart6")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Khung giờ"]))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Doanh số bán TB"]) || 1])
            .nice()
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const bars = chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Khung giờ"]))
            .attr("y", d => y(d["Doanh số bán TB"]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d["Doanh số bán TB"]))
            .attr("fill", d => colorScale(d["Khung giờ"]));

        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Khung giờ"]) + x.bandwidth() / 2)
            .attr("y", d => y(d["Doanh số bán TB"]) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${Math.round(d["Doanh số bán TB"]).toLocaleString("vi-VN")} VND`)
            .style("font-size", "10px");

        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("font-size", "12px")
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)");

        chart.append("g")
            .call(d3.axisLeft(y)
                .tickFormat(d => d.toLocaleString("vi-VN"))
            )
            .style("font-size", "11px");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Doanh số bán hàng trung bình theo Khung giờ");
    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
