import React, { useEffect, useState } from "react";
import { Table, TableColumn } from "../components/ui/Table";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Report {
  id: string;
  project_name: string;
  project_status: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_percentage: number;
}


const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/reports/aggregate")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.data);
        setFilteredReports(data.data);
      })
      .catch((err) => console.error("Error fetching reports:", err));
  }, []);

  // Filtering logic
  useEffect(() => {
    let filtered = reports;

    if (projectFilter) {
      filtered = filtered.filter((report) =>
        report.project_name.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }
    if (userFilter) {
      filtered = filtered.filter((report) =>
        report.project_status.toLowerCase().includes(userFilter.toLowerCase())
      );
    }
    if (dateFilter) {
      // Assuming reports have a date field (not currently in your schema)
      filtered = filtered.filter((_report) =>
        new Date().toISOString().slice(0, 10) === dateFilter
      );
    }

    setFilteredReports(filtered);
  }, [projectFilter, userFilter, dateFilter, reports]);

  const columns: TableColumn<Report>[] = [
    { header: "Project Name", accessor: "project_name", sortable: true },
    { header: "Project Status", accessor: "project_status", sortable: true },
    { header: "Total Tasks", accessor: "total_tasks", sortable: true },
    { header: "Completed Tasks", accessor: "completed_tasks", sortable: true },
    { header: "Pending Tasks", accessor: "pending_tasks", sortable: true },
    { header: "Completion (%)", accessor: "completion_percentage", sortable: true },
  ];

  
  const exportCSV = () => {
    const csvContent = [
      ["Project Name", "Project Status", "Total Tasks", "Completed Tasks", "Pending Tasks", "Completion (%)"],
      ...filteredReports.map((r) => [
        r.project_name,
        r.project_status,
        r.total_tasks,
        r.completed_tasks,
        r.pending_tasks,
        r.completion_percentage,
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "report.csv";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Project Reports", 14, 10);
    autoTable(doc, {
      head: [["Project Name", "Project Status", "Total Tasks", "Completed Tasks", "Pending Tasks", "Completion (%)"]],
      body: filteredReports.map((r) => [
        r.project_name,
        r.project_status,
        r.total_tasks,
        r.completed_tasks,
        r.pending_tasks,
        `${r.completion_percentage}%`
      ]),
    });
    doc.save("report.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredReports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "report.xlsx");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Project Reports</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by Project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="border p-2 rounded-md"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border p-2 rounded-md"
        />
        <input
          type="text"
          placeholder="Filter by User"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="border p-2 rounded-md"
        />
      </div>

      
      <button
        onClick={() => console.log("Generating Report...")}
        className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
      >
        Generate Report
      </button>

      {/* Table */}
      <Table data={filteredReports || []} columns={columns} itemsPerPage={10} />

      {/* Export Buttons */}
      <div className="mt-4 flex gap-4">
        <button onClick={exportCSV} className="bg-green-500 text-white px-4 py-2 rounded-md">
          Export as CSV
        </button>
        <button onClick={exportPDF} className="bg-red-500 text-white px-4 py-2 rounded-md">
          Export as PDF
        </button>
        <button onClick={exportExcel} className="bg-yellow-500 text-white px-4 py-2 rounded-md">
          Export as Excel
        </button>
      </div>
    </div>
  );
};

export default Reports;
