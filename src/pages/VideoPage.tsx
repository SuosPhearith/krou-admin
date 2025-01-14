import { useState, useEffect, ChangeEvent, useRef } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Switch,
  Progress,
} from "antd";
import { ColumnsType } from "antd/es/table";
import useDebounce, { uploadChunk } from "../apis/share";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { MdOutlineRemoveRedEye } from "react-icons/md";

const CHUNK_SIZE = 2 * 1024 * 1024;
const { confirm } = Modal;

// Video Interface
interface Video {
  id: number;
  title: string;
  video_uri: string;
  lecturers_id: number;
  status: boolean;
}

const VideoPage = () => {
  // State management
  const { id } = useParams<{ id: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 500);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [progressFile, setProgressFile] = useState<number>(0);
  const [videoUri, setVideoUri] = useState("");

  // Fetch videos
  const fetchVideos = async (searchValue: string = search) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        data: Video[];
        total: number;
        current_page: number;
      }>(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/videos?search=${searchValue}&page=${page}&lecturers_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setVideos(response.data.data);
      setTotal(response.data.total);
      setPage(response.data.current_page);
    } catch (error) {
      console.error(error);
      message.error("ការទាញយក វីដេអូ បានបរាជ័យ");
    } finally {
      setLoading(false);
    }
  };

  // Open Modal for creating a new video
  const openModal = () => {
    setIsModalOpen(true);
    form.resetFields();
    setFile(null);
    setVideoUri("");
    setProgressFile(0);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFile(null);
    setVideoUri("");
    setProgressFile(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle form submission for creating a new video
  const handleFormSubmit = async (values: Omit<Video, "id">) => {
    try {
      if (!videoUri) {
        message.error("សូមបញ្ចូលវីដេអូ!");
        return;
      }
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/videos/create`,
        {
          ...values,
          lecturers_id: id,
          video_uri: videoUri,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      message.success("បង្កើត វីដេអូ បានជោគជ័យ");
      fetchVideos();
      closeModal();
    } catch (error) {
      console.error(error);
      message.error("ការបង្កើត វីដេអូ បានបរាជ័យ");
    }
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUploadFile = async () => {
    if (!file) {
      message.error("សូមជ្រើសរើសវីដេអូ");
      return;
    }

    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const fileName = file.name;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(fileSize, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);
      const res = await uploadChunk(chunk, i, totalChunks, fileName);

      setProgressFile(Math.round(((i + 1) / totalChunks) * 100));

      if (i === totalChunks - 1) {
        setVideoUri(res.data?.fileUrl);
      }
    }
  };

  // Toggle video status
  const handleStatusChange = async (id: number) => {
    confirm({
      title: "តើអ្នកពិតជាចង់ប្តូរស្ថានភាព?",
      icon: <ExclamationCircleFilled />,
      async onOk() {
        try {
          await axios.patch(
            `${
              import.meta.env.VITE_APP_API_URL
            }/api/videos/toggle-status/${id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
          message.success("ស្ថានភាពត្រូវបានប្តូរដោយជោគជ័យ!");
          fetchVideos();
        } catch (error) {
          console.error(error);
          message.error("ការប្តូរស្ថានភាព បានបរាជ័យ");
        }
      },
    });
  };

  // Delete a video
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/api/videos/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      message.success("លុប វីដេអូ បានជោគជ័យ");
      fetchVideos();
    } catch (error) {
      console.error(error);
      message.error("ការលុប វីដេអូ បានបរាជ័យ");
    }
  };

  // Fetch videos on page load and when search changes
  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // Define table columns
  const columns: ColumnsType<Video> = [
    {
      title: "ចំណងជើង",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "វីដេអូ",
      dataIndex: "video_uri",
      key: "video_uri",
      render: (video_uri) =>
        video_uri ? (
          <a
            href={`${import.meta.env.VITE_APP_ASSET_URL}/${video_uri}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button icon={<MdOutlineRemoveRedEye />} size="middle">
              មើលវីដេអូ
            </Button>
          </a>
        ) : (
          "No Video"
        ),
    },
    {
      title: "ស្ថានភាព",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Switch
          checked={status}
          onChange={() => handleStatusChange(record.id)}
          checkedChildren="សកម្ម"
          unCheckedChildren="មិនសកម្ម"
        />
      ),
    },
    {
      title: "សកម្មភាព",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Popconfirm
            title="តើអ្នកប្រាកដថាចង់លុប វីដេអូ?"
            onConfirm={() => handleDelete(record.id)}
            okText="បាទ/ចាស"
            cancelText="ទេ"
          >
            <Button danger>លុប</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="ស្វែងរក"
          value={search}
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/6"
        />
        <Button type="primary" onClick={openModal}>
          បង្កើត វីដេអូ
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={videos}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total: total,
          onChange: (page) => setPage(page),
        }}
      />

      <Modal
        maskClosable={false}
        title="បង្កើត វីដេអូ"
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="title"
            label="ចំណងជើង"
            rules={[{ required: true, message: "សូមបញ្ចូលចំណងជើង" }]}
          >
            <Input />
          </Form.Item>

          <div className="w-full">
            <p>វីដេអូ</p>
            <input
              type="file"
              ref={fileInputRef}
              className="my-2 w-full"
              onChange={handleFileChange}
            />
            <Button
              type="primary"
              onClick={handleUploadFile}
              disabled={!file || progressFile > 0}
              block
            >
              Upload
            </Button>
            {progressFile > 0 && (
              <Progress
                percent={progressFile}
                status={progressFile < 100 ? "active" : "success"}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />
            )}
          </div>

          <div className="w-full flex justify-end mt-4">
            <Button onClick={closeModal} className="me-3">
              បោះបង់
            </Button>
            <Button type="primary" htmlType="submit">
              បង្កើត
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default VideoPage;
