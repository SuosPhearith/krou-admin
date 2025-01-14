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

interface BookDocument {
  id: number;
  title: string;
  file_uri: string;
  books_id: number;
  status: boolean;
}

const BookDocPage = () => {
  // State management
  const { id } = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<BookDocument[]>([]);
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
  const [fileUri, setFileUri] = useState("");

  // Fetch book documents with pagination and search
  const fetchDocuments = async (searchValue: string = search) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        data: BookDocument[];
        total: number;
        current_page: number;
      }>(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/book-documents?search=${searchValue}&page=${page}&books_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setDocuments(response.data.data);
      setTotal(response.data.total);
      setPage(response.data.current_page);
    } catch (error) {
      console.error(error);
      message.error("ការទាញយក ឯកសារ បានបរាជ័យ");
    } finally {
      setLoading(false);
    }
  };

  // Open Modal for creating a new document
  const openModal = () => {
    setIsModalOpen(true);
    form.resetFields();
    setFile(null);
    setFileUri("");
    setProgressFile(0);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFile(null);
    setFileUri("");
    setProgressFile(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle form submission for creating a new document
  const handleFormSubmit = async (values: Omit<BookDocument, "id">) => {
    try {
      if (!fileUri) {
        message.error("សូមបញ្ចូលឯកសារ!");
        return;
      }
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/book-documents/create`,
        {
          ...values,
          books_id: id,
          file_uri: fileUri,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      message.success("បង្កើត ឯកសារ បានជោគជ័យ");
      fetchDocuments();
      closeModal();
    } catch (error) {
      console.error(error);
      message.error("ការបង្កើត ឯកសារ បានបរាជ័យ");
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
      message.error("សូមជ្រើសរើសឯកសារ");
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

  // Toggle document status
  const handleStatusChange = async (id: number) => {
    confirm({
      title: "តើអ្នកពិតជាចង់ប្តូរស្ថានភាព?",
      icon: <ExclamationCircleFilled />,
      async onOk() {
        try {
          await axios.patch(
            `${
              import.meta.env.VITE_APP_API_URL
            }/api/book-documents/toggle-status/${id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
          message.success("ស្ថានភាពត្រូវបានប្តូរដោយជោគជ័យ!");
          fetchDocuments();
        } catch (error) {
          console.error(error);
          message.error("ការប្តូរស្ថានភាព បានបរាជ័យ");
        }
      },
    });
  };

  // Delete a document
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/api/book-documents/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      message.success("លុប ឯកសារ បានជោគជ័យ");
      fetchDocuments();
    } catch (error) {
      console.error(error);
      message.error("ការលុប ឯកសារ បានបរាជ័យ");
    }
  };

  // Fetch documents on page load and when search changes
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // Define table columns
  const columns: ColumnsType<BookDocument> = [
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
            <Button icon={<MdOutlineRemoveRedEye />} size="middle">
              មើលឯកសារ
            </Button>
          </a>
        ) : (
          "No File"
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
            title="តើអ្នកប្រាកដថាចង់លុប ឯកសារ នេះមែនទេ?"
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
          បង្កើតឯកសារ
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={documents}
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
        title="បង្កើត ឯកសារ"
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
            <p>ឯកសារ</p>
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

export default BookDocPage;
