import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Layout, Menu, Modal, theme } from "antd";
import logoImage from "./assets/images/logo.png";
import { RxDashboard } from "react-icons/rx";
import DashboardPage from "./pages/DashboardPage";
import WorksheetPage from "./pages/WorksheetPage";
import WorksheetDocPage from "./pages/WorksheetDocPage";
import BookPage from "./pages/BookPage";
import BookDocPage from "./pages/BookDocPage";
import DocumentPage from "./pages/DocumentPage";
import LecturerPage from "./pages/LecturerPage";
import VideoPage from "./pages/VideoPage";
import { GrBook, GrDocumentPdf, GrDocumentVideo } from "react-icons/gr";
import LoginPage from "./pages/LoginPage";
import { FiLogOut } from "react-icons/fi";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import VideoDocsPage from "./pages/VideoDocPage";

const { Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // 🔄 Use useLocation to get the current URL path
  const location = useLocation();

  // 🗂 Define the menu items
  const items = [
    {
      key: "/",
      icon: <RxDashboard />,
      label: <Link to="/">ផ្ទាំងគ្រប់គ្រងទូទៅ</Link>,
    },
    {
      key: "/document",
      icon: <GrDocumentVideo />,
      label: <Link to="/document">ឯកសារជំនួយ</Link>,
    },
    {
      key: "/book",
      icon: <GrBook />,
      label: <Link to="/book">សៀវភៅកិច្ចតែងការ</Link>,
    },
    {
      key: "/worksheet",
      icon: <GrDocumentPdf />,
      label: <Link to="/worksheet">សន្លឹកកិច្ចការ</Link>,
    },
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout",
      icon: <ExclamationCircleOutlined />,
      content: "តើអ្នកចង់ចាក់ចេញពីប្រព័ន្ធមែនទេ?",
      okText: "Logout",
      cancelText: "ទេ",
      onOk: async () => {
        await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/logout`);
        window.localStorage.clear();
        window.location.href = "/login";
      },
    });
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider theme="light" trigger={null} collapsible collapsed={collapsed}>
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-12 flex justify-center items-center my-4 cursor-pointer"
        >
          <img className="w-14" src={logoImage} alt="logo" />
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
        />
        <div className="absolute bottom-0 w-full p-3 flex justify-center items-center">
          <div
            onClick={() => handleLogout()}
            className="cursor-pointer flex items-center rounded-md gap-1 hover:bg-slate-400 p-1"
          >
            <FiLogOut /> Logout
          </div>
        </div>
      </Sider>

      <Layout>
        <Content
          style={{
            margin: "24px 16px",
            padding: 10,
            minHeight: 280,
            borderRadius: borderRadiusLG,
            height: "calc(100vh - 120px)",
            overflow: "auto",
            backgroundColor: "#fff",
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/book/:id" element={<BookDocPage />} />
            <Route path="/worksheet" element={<WorksheetPage />} />
            <Route path="/worksheet/:id" element={<WorksheetDocPage />} />
            <Route path="/document" element={<DocumentPage />} />
            <Route path="/document/:id" element={<LecturerPage />} />
            <Route path="/lecturer/:id" element={<VideoPage />} />
            <Route path="/video-doc/:id" element={<VideoDocsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const AppWrapper: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem("authToken");

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <Route path="/login" element={<LoginPage />} />
        ) : (
          <>
            <Route path="/*" element={<App />} />
          </>
        )}
        {!isAuthenticated && (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
};

export default AppWrapper;
