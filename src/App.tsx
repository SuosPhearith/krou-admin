import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
import logoImage from "./assets/images/logo.png";
import { RxDashboard } from "react-icons/rx";
import { FiBook } from "react-icons/fi";
import DashboardPage from "./pages/DashboardPage";
import WorksheetPage from "./pages/WorksheetPage";
import WorksheetDocPage from "./pages/WorksheetDocPage";
import { RiFilePaper2Line } from "react-icons/ri";
import BookPage from "./pages/BookPage";
import BookDocPage from "./pages/BookDocPage";

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 🔄 Use useLocation to get the current URL path
  const location = useLocation();

  // 🗂 Define the menu items
  const items = [
    {
      key: "/",
      icon: <RxDashboard size={20}/>,
      label: <Link to="/">ផ្ទាំងគ្រប់គ្រងទូទៅ</Link>,
    },
    {
      key: "/book",
      icon: <FiBook size={20}/>,
      label: <Link to="/book">សៀវភៅកិច្ចតែងការ</Link>,
    },
    {
      key: "/worksheet",
      icon: <RiFilePaper2Line size={20}/>,
      label: <Link to="/worksheet">សន្លឹកកិច្ចការ</Link>,
    },
  ];

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider theme="light" trigger={null} collapsible collapsed={collapsed}>
        <div className="w-full h-12 flex justify-center items-center my-4">
          <img className="w-14" src={logoImage} alt="logo" />
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
        />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
        </Header>

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
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const AppWrapper: React.FC = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;
