"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface PeakHoursChartProps {
  attendanceData: any[]
}

export function PeakHoursChart({ attendanceData }: PeakHoursChartProps) {
  // Process attendance data to get hourly counts
  const hourlyCounts = Array(24).fill(0)
  attendanceData.forEach((record) => {
    const hour = new Date(record.check_in_time).getHours()
    hourlyCounts[hour]++
  })

  const data = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Attendance",
        data: hourlyCounts,
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
    },
  }

  return (
    <div className="h-[300px]">
      <Bar data={data} options={options} />
    </div>
  )
}

