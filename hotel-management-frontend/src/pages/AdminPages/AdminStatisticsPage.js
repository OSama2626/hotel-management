import React, { useState, useEffect, useMemo } from 'react';
import { bookService, getHotels, getRooms } from '../../services/roomService';
import { getAllUsers } from '../../services/authService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './AdminPages.css';

const getAllMockRoomsCount = async () => {
    return 50;
};

const AdminStatisticsPage = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    uniqueClients: 0,
    occupancyRate: 0,
    avgBookingDuration: 0,
    bookingsByStatus: {},
    revenueByHotel: {},
  });
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true); setError('');
      try {
        const [allBookingsResponse, hotelData, allUsersResponse, totalSystemRoomsCount] = await Promise.all([
          bookService.getBookingsForHotel(null, {}),
          getHotels(),
          getAllUsers(),
          getAllMockRoomsCount()
        ]);

        setHotels(hotelData);

        const relevantBookings = allBookingsResponse.filter(
          b => b.status === 'Confirmed' || b.status === 'Checked-in' || b.status === 'Checked-out'
        );

        let calculatedTotalRevenue = 0;
        let calculatedTotalNightsBooked = 0;
        const calculatedRevenueByHotel = {};

        relevantBookings.forEach(b => {
          const startDate = new Date(b.startDate);
          const endDate = new Date(b.endDate);
          const duration = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
          const pricePerNight = b.bookedPricePerNight !== undefined ? b.bookedPricePerNight : (b.roomPrice || 0);
          const bookingRevenue = pricePerNight * duration;

          calculatedTotalRevenue += bookingRevenue;
          calculatedTotalNightsBooked += duration;

          if (!calculatedRevenueByHotel[b.hotelId]) calculatedRevenueByHotel[b.hotelId] = 0;
          calculatedRevenueByHotel[b.hotelId] += bookingRevenue;
        });

        const uniqueClientIds = new Set(allBookingsResponse.map(b => b.userId));

        const calculatedBookingsByStatus = allBookingsResponse.reduce((acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
        }, {});

        const periodInDays = 30;
        const totalRoomDaysAvailable = totalSystemRoomsCount * periodInDays;
        const occupancyRateCalc = totalRoomDaysAvailable > 0 ? (calculatedTotalNightsBooked / totalRoomDaysAvailable) * 100 : 0;

        setStats({
          totalBookings: allBookingsResponse.length,
          totalRevenue: calculatedTotalRevenue,
          uniqueClients: uniqueClientIds.size,
          occupancyRate: parseFloat(occupancyRateCalc.toFixed(2)),
          avgBookingDuration: relevantBookings.length > 0 ? parseFloat((calculatedTotalNightsBooked / relevantBookings.length).toFixed(1)) : 0,
          bookingsByStatus: calculatedBookingsByStatus,
          revenueByHotel: calculatedRevenueByHotel,
        });

      } catch (err) {
        setError("Failed to calculate statistics. " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getHotelName = (hotelId) => hotels.find(h => h.id === hotelId)?.name || hotelId;

  const exportToCsv = (filename, rows) => {
    const processRow = row => row.map(cell => {
      let cellValue = cell === null || cell === undefined ? '' : String(cell);
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        cellValue = '"' + cellValue.replace(/"/g, '""') + '"';
      }
      return cellValue;
    }).join(',');

    const csvContent = rows.map(processRow).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('CSV export is not supported in your browser.');
    }
  };

  const handleCsvExport = (statsData, hotelList) => {
    const csvData = [
      ["Statistic", "Value", "Details"],
      ["Total Bookings", statsData.totalBookings, ""],
      ["Total Revenue", statsData.totalRevenue.toFixed(2), ""],
      ["Unique Clients", statsData.uniqueClients, ""],
      ["Avg. Occupancy (30d)", `${statsData.occupancyRate}%`, ""],
      ["Avg. Booking Duration", `${statsData.avgBookingDuration} nights`, ""],
    ];

    Object.entries(statsData.bookingsByStatus).forEach(([status, count]) => {
      csvData.push(["Bookings by Status - " + status, count, ""]);
    });

    Object.entries(statsData.revenueByHotel).forEach(([hotelId, revenue]) => {
      csvData.push(["Revenue - " + getHotelName(hotelId), revenue.toFixed(2), ""]);
    });

    exportToCsv('hotel_statistics.csv', csvData);
  };

  const handlePdfExport = (statsData, hotelList) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Hotel Statistics Report', 14, 22);

    const mainStatsTableColumns = ["Statistic", "Value"];
    const mainStatsTableRows = [
      ["Total Bookings", statsData.totalBookings],
      ["Total Revenue", `$${statsData.totalRevenue.toFixed(2)}`],
      ["Unique Clients", statsData.uniqueClients],
      ["Avg. Occupancy (30d)", `${statsData.occupancyRate}%`],
      ["Avg. Booking Duration", `${statsData.avgBookingDuration} nights`],
    ];
    doc.autoTable({ head: [mainStatsTableColumns], body: mainStatsTableRows, startY: 30 });
    let currentY = doc.lastAutoTable.finalY || 30;

    if (Object.keys(statsData.bookingsByStatus).length > 0) {
      const statusTableColumns = ["Status", "Count"];
      const statusTableRows = Object.entries(statsData.bookingsByStatus).map(([status, count]) => [status, count]);

      const requiredHeight = 20 + (statusTableRows.length * 10) + 10;
      if (currentY + requiredHeight > doc.internal.pageSize.height - 20) {
          doc.addPage();
          currentY = 22;
      } else {
          currentY += 15;
      }

      doc.setFontSize(16);
      doc.text('Bookings by Status', 14, currentY);
      doc.autoTable({ head: [statusTableColumns], body: statusTableRows, startY: currentY + 8 });
      currentY = doc.lastAutoTable.finalY;
    }

    if (Object.keys(statsData.revenueByHotel).length > 0) {
      const revenueHotelTableColumns = ["Hotel", "Revenue"];
      const revenueHotelTableRows = Object.entries(statsData.revenueByHotel).map(([hotelId, revenue]) => [
        getHotelName(hotelId),
        `$${revenue.toFixed(2)}`
      ]);

      const requiredHeight = 20 + (revenueHotelTableRows.length * 10) + 10;
      if (currentY + requiredHeight > doc.internal.pageSize.height - 20) {
          doc.addPage();
          currentY = 22;
      } else {
          currentY += 15;
      }

      doc.setFontSize(16);
      doc.text('Revenue by Hotel', 14, currentY);
      doc.autoTable({ head: [revenueHotelTableColumns], body: revenueHotelTableRows, startY: currentY + 8 });
    }

    doc.save('hotel_statistics.pdf');
  };

  const handleExcelExport = (statsData, hotelList) => {
    const wb = XLSX.utils.book_new();

    const mainStatsData = [
      ["Statistic", "Value"],
      ["Total Bookings", statsData.totalBookings],
      ["Total Revenue", statsData.totalRevenue.toFixed(2)],
      ["Unique Clients", statsData.uniqueClients],
      ["Avg. Occupancy (30d)", `${statsData.occupancyRate}%`],
      ["Avg. Booking Duration", `${statsData.avgBookingDuration} nights`],
    ];
    mainStatsData[2][1] = parseFloat(statsData.totalRevenue.toFixed(2));
    mainStatsData[4][1] = statsData.occupancyRate;
    mainStatsData[5][1] = statsData.avgBookingDuration;

    const wsMain = XLSX.utils.aoa_to_sheet(mainStatsData);
    XLSX.utils.book_append_sheet(wb, wsMain, "Main Statistics");

    if (statsData.bookingsByStatus && Object.keys(statsData.bookingsByStatus).length > 0) {
      const statusData = [["Status", "Count"]];
      Object.entries(statsData.bookingsByStatus).forEach(([status, count]) => {
        statusData.push([status, count]);
      });
      const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
      XLSX.utils.book_append_sheet(wb, wsStatus, "Bookings by Status");
    }

    if (statsData.revenueByHotel && Object.keys(statsData.revenueByHotel).length > 0) {
      const revenueHotelData = [["Hotel", "Revenue"]];
      Object.entries(statsData.revenueByHotel).forEach(([hotelId, revenue]) => {
        revenueHotelData.push([getHotelName(hotelId), parseFloat(revenue.toFixed(2))]);
      });
      const wsRevenueHotel = XLSX.utils.aoa_to_sheet(revenueHotelData);
      XLSX.utils.book_append_sheet(wb, wsRevenueHotel, "Revenue by Hotel");
    }

    XLSX.writeFile(wb, 'hotel_statistics.xlsx');
  };

  if (loading) return <div className="admin-page"><p>Loading statistics...</p></div>;
  if (error) return <div className="admin-page"><p className="error-message">{error}</p></div>;

  return (
    <div className="admin-page">
      <header className="admin-header"><h1>Hotel Statistics & Dashboard</h1></header>
      <main className="admin-content">
        <div className="stats-overview">
          <div className="stat-card"><h4>Total Bookings</h4><p>{stats.totalBookings}</p></div>
          <div className="stat-card"><h4>Total Revenue</h4><p>${stats.totalRevenue.toFixed(2)}</p></div>
          <div className="stat-card"><h4>Unique Clients</h4><p>{stats.uniqueClients}</p></div>
          <div className="stat-card"><h4>Avg. Occupancy (30d)</h4><p>{stats.occupancyRate}%</p></div>
          <div className="stat-card"><h4>Avg. Booking Duration</h4><p>{stats.avgBookingDuration} nights</p></div>
        </div>

        <div className="stats-details-grid">
            <div className="stats-section">
                <h3>Bookings by Status</h3>
                {Object.keys(stats.bookingsByStatus).length > 0 ? (
                    <ul>
                        {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
                            <li key={status}>{status}: <strong>{count}</strong></li>
                        ))}
                    </ul>
                ) : <p>No booking status data.</p>}
            </div>

            <div className="stats-section">
                <h3>Revenue by Hotel</h3>
                 {Object.keys(stats.revenueByHotel).length > 0 ? (
                    <ul>
                        {Object.entries(stats.revenueByHotel).map(([hotelId, revenue]) => (
                            <li key={hotelId}>{getHotelName(hotelId)}: <strong>${revenue.toFixed(2)}</strong></li>
                        ))}
                    </ul>
                ) : <p>No revenue data by hotel.</p>}
            </div>
        </div>

        <div className="stats-section">
            <h3>Booking Sources (Mock Data)</h3>
            <div className="mock-chart-bar-container">
                <div className="mock-bar" style={{ height: '70%', backgroundColor: '#007bff' }}><span className="bar-label">Web (70%)</span></div>
                <div className="mock-bar" style={{ height: '20%', backgroundColor: '#28a745' }}><span className="bar-label">Mobile (20%)</span></div>
                <div className="mock-bar" style={{ height: '10%', backgroundColor: '#ffc107' }}><span className="bar-label">Reception (10%)</span></div>
            </div>
        </div>

        <div className="export-actions stats-section">
          <h3>Export Data</h3>
          <button onClick={() => handlePdfExport(stats, hotels)} className="action-btn">Export PDF</button>
          <button onClick={() => handleCsvExport(stats, hotels)} className="action-btn">Export CSV</button>
          <button onClick={() => handleExcelExport(stats, hotels)} className="action-btn">Export Excel</button>
        </div>
      </main>
    </div>
  );
};

export default AdminStatisticsPage;