import { useEffect, useState } from "react";
import axios from "axios";
import worksheetImg from "./../assets/images/worksheet.png";
import bookImg from "./../assets/images/book.png";
import documentImg from "./../assets/images/document.png";
import teacherImg from "./../assets/images/teacher.png";
import videoImg from "./../assets/images/video.png";

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Use async/await inside useEffect
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/api/dashboard-counts`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Display a loading message
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // ✅ If no data is available, display an error message
  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        No data available.
      </div>
    );
  }

  // ✅ Display the dashboard items
  const items = [
    { name: "សន្លឹកកិច្ចការ", image: worksheetImg, key: "worksheets" },
    {
      name: "ឯកសារសន្លឹកកិច្ចការ",
      image: worksheetImg,
      key: "worksheet_documents",
    },
    { name: "សៀវភៅកិច្ចតែងការ", image: bookImg, key: "books" },
    { name: "ឯកសារសៀវភៅកិច្ចតែងការ", image: bookImg, key: "book_documents" },
    { name: "ឯកសារ", image: documentImg, key: "documents" },
    { name: "សាស្ដ្រាចារ្យ", image: teacherImg, key: "lecturers" },
    { name: "វីដេអូ", image: videoImg, key: "videos" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <div
          key={item.key}
          className="bg-slate-100 flex flex-col justify-center items-center rounded-lg overflow-hidden p-4"
        >
          <img src={item.image} alt={item.name} className="w-24 object-cover" />
          <div className="pt-6 mb-3">
            <h2 className="text-xl font-bold">{item.name}</h2>
          </div>
          <p className="text-gray-600">សរុប: {data[item.key]}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;
