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
import { MdOutlineRemoveRedEye } from "react-icons/md";
import moment from "moment";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import useDebounce, { uploadChunk } from "../apis/share";
import { ImArrowLeft } from "react-icons/im";
const CHUNK_SIZE = 2 * 1024 * 1024;
const { confirm } = Modal;

// ចំណុចប្រទាក់ VideoDoc
interface VideoDoc {
  id: number;
  title: string;
  file_uri: string;
  status: boolean;
  created_at: string;
}

const VideoDocsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [videoDocs, setVideoDocs] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentDoc, setCurrentDoc] = useState<VideoDoc | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progressFile, setProgressFile] = useState<number>(0);
  const [fileUri, setFileUri] = useState("");

  // ទាញយកឯកសារ
  const fetchVideoDocs = async (searchValue: string = search) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        data: VideoDoc[];
        total: number;
        current_page: number;
      }>(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/video-docs?search=${searchValue}&page=${page}&videos_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setVideoDocs(response.data.data);
      setTotal(response.data.total);
      setPage(response.data.current_page);
    } catch (error) {
      console.error(error);
      message.error("ការទាញយកឯកសារបានបរាជ័យ។");
    } finally {
      setLoading(false);
    }
  };

  // បើកមុខម៉ូដាល់
  const openModal = (doc: VideoDoc | null = null) => {
    setIsModalOpen(true);
    setIsEdit(!!doc);
    setCurrentDoc(doc);
    if (doc) {
      form.setFieldsValue(doc);
    } else {
      form.resetFields();
    }
  };

  // បិទមុខម៉ូដាល់
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentDoc(null);
    setFile(null);
    setFileUri("");
    setProgressFile(0);
    form.resetFields();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ដំណើរការស្នើសុំទម្រង់
  const handleFormSubmit = async (
    values: Omit<VideoDoc, "id" | "status" | "created_at">
  ) => {
    try {
      if (isEdit && currentDoc) {
        await axios.put(
          `${import.meta.env.VITE_APP_API_URL}/api/video-docs/${currentDoc.id}`,
          {
            ...values,
            file_uri: fileUri || currentDoc.file_uri,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        message.success("ការកែប្រែឯកសារបានជោគជ័យ។");
      } else {
        if (!fileUri) {
          message.error("សូមផ្ទុកឯកសារ។");
          return;
        }
        await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/video-docs`, {
          ...values,
          file_uri: fileUri,
          videos_id: id,
        });
        message.success("ការបង្កើតឯកសារបានជោគជ័យ។");
      }
      fetchVideoDocs();
      closeModal();
    } catch (error) {
      console.error(error);
      message.error("ការរក្សាទុកឯកសារបានបរាជ័យ។");
    }
  };

  // លុបឯកសារ
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/api/video-docs/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      message.success("ការលុបឯកសារបានជោគជ័យ។");
      fetchVideoDocs();
    } catch (error) {
      console.error(error);
      message.error("ការលុបឯកសារបានបរាជ័យ។");
    }
  };

  // ផ្ទុកឯកសារ
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!file) {
      message.error("សូមជ្រើសរើសឯកសារ។");
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
        setFileUri(res.data?.fileUrl);
      }
    }
  };

  // ប្តូរស្ថានភាព
  const handleStatusChange = async (id: number) => {
    confirm({
      title: "តើអ្នកពិតជាចង់ប្តូរស្ថានភាពមែនទេ?",
      icon: <ExclamationCircleFilled />,
      async onOk() {
        try {
          await axios.patch(
            `${
              import.meta.env.VITE_APP_API_URL
            }/api/video-docs/${id}/toggle-status`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
          message.success("ស្ថានភាពត្រូវបានកែប្រែដោយជោគជ័យ។");
          fetchVideoDocs();
        } catch (error) {
          console.error(error);
          message.error("ការកែប្រែស្ថានភាពបានបរាជ័យ។");
        }
      },
    });
  };

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchVideoDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const columns: ColumnsType<VideoDoc> = [
    {
      title: "ចំណងជើង",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "ឯកសារ",
      dataIndex: "file_uri",
      key: "file_uri",
      render: (file_uri) =>
        file_uri ? (
          <a
            href={`${import.meta.env.VITE_APP_ASSET_URL}/${file_uri}`}
            target="_blank"
          >
            <Button icon={<MdOutlineRemoveRedEye />}>មើលឯកសារ</Button>
          </a>
        ) : (
          "គ្មានឯកសារ"
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
      title: "កាលបរិច្ឆេទបង្កើត",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) => moment(created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "សកម្មភាព",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button type="primary" onClick={() => openModal(record)}>
            កែប្រែ
          </Button>
          <Popconfirm
            title="តើអ្នកប្រាកដថាចង់លុបឯកសារនេះមែនទេ?"
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

  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center w-1/2">
          <div>
            <ImArrowLeft
              size={20}
              className="me-4 text-blue-500 cursor-pointer"
              onClick={() => navigate(-1)}
            />
          </div>
          <Input
            placeholder="ស្វែងរកតាមចំណងជើង"
            value={search}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/3"
          />
        </div>
        <Button type="primary" onClick={() => openModal()}>
          បង្កើតឯកសារ
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={videoDocs}
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
        title={isEdit ? "កែប្រែឯកសារ" : "បង្កើតឯកសារ"}
        open={isModalOpen}
        onCancel={closeModal}
        maskClosable={false}
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

          <div className="flex gap-4">
            <div className="w-1/2">
              <p>ឯកសារ</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button
                type="primary"
                onClick={handleUploadFile}
                disabled={!file || progressFile !== 0}
                block
              >
                ផ្ទុកឡើង
              </Button>
              {progressFile > 0 && <Progress percent={progressFile} />}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={closeModal} className="me-3">
              បោះបង់
            </Button>
            <Button type="primary" htmlType="submit">
              {isEdit ? "កែប្រែ" : "បង្កើត"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default VideoDocsPage;
