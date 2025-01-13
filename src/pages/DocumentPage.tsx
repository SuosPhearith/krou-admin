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
  Image,
} from "antd";
import { ColumnsType } from "antd/es/table";
import useDebounce, { uploadChunk } from "../apis/share";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const CHUNK_SIZE = 2 * 1024 * 1024;
const { confirm } = Modal;

// ប្រភេទ Document
interface Document {
  id: number;
  title: string;
  cover_uri: string;
  status: boolean;
}

const DocumentPage = () => {
  // ស្ថានភាព
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 500);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [progressCover, setProgressCover] = useState<number>(0);
  const [coverUri, setCoverUri] = useState("");
  const navigate = useNavigate()

  // ទាញយក Document
  const fetchDocuments = async (searchValue: string = search) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        data: Document[];
        total: number;
        current_page: number;
      }>(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/documents?search=${searchValue}&page=${page}`
      );
      setDocuments(response.data.data);
      setTotal(response.data.total);
      setPage(response.data.current_page);
    } catch (error) {
      console.error(error);
      message.error("ការទាញយកឯកសារ បានបរាជ័យ");
    } finally {
      setLoading(false);
    }
  };

  // បើក Modal
  const openModal = (document: Document | null = null) => {
    setIsModalOpen(true);
    setIsEdit(!!document);
    setCurrentDocument(document);
    if (document) {
      form.setFieldsValue(document);
    } else {
      form.resetFields();
      setCover(null);
      setCoverUri("");
      setProgressCover(0);
    }
  };

  // បិទ Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentDocument(null);
    form.resetFields();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCover(null);
    setCoverUri("");
    setProgressCover(0);
  };

  // ដោះស្រាយការដាក់ស្នើ Form
  const handleFormSubmit = async (values: Omit<Document, "id">) => {
    try {
      if (isEdit && currentDocument) {
        await axios.put(
          `${import.meta.env.VITE_APP_API_URL}/api/documents/update/${
            currentDocument.id
          }`,
          {
            ...values,
            cover_uri: coverUri,
          }
        );
        message.success("ការកែប្រែឯកសារ បានជោគជ័យ");
      } else {
        if (!coverUri) {
          message.error("សូមបញ្ចូលរូបភាពក្រប");
          return;
        }
        await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/api/documents/create`,
          {
            ...values,
            cover_uri: coverUri,
          }
        );
        message.success("បង្កើតឯកសារ បានជោគជ័យ");
      }
      fetchDocuments();
      closeModal();
    } catch (error) {
      console.error(error);
      message.error("ការរក្សាទុកឯកសារ បានបរាជ័យ");
    }
  };

  // ដោះស្រាយការលុប
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/api/documents/delete/${id}`
      );
      message.success("ការលុបឯកសារ បានជោគជ័យ");
      fetchDocuments();
    } catch (error) {
      console.error(error);
      message.error("ការលុបឯកសារ បានបរាជ័យ");
    }
  };

  // ដោះស្រាយការប្តូរស្ថានភាព
  const handleStatusChange = async (id: number) => {
    confirm({
      title: "តើអ្នកពិតជាចង់ប្តូរស្ថានភាព?",
      icon: <ExclamationCircleFilled />,
      async onOk() {
        try {
          await axios.patch(
            `${
              import.meta.env.VITE_APP_API_URL
            }/api/documents/toggle-status/${id}`
          );
          message.success("ការប្តូរស្ថានភាព បានជោគជ័យ");
          fetchDocuments();
        } catch (error) {
          console.error(error);
          message.error("ការប្តូរស្ថានភាព បានបរាជ័យ");
        }
      },
    });
  };

  // ដោះស្រាយការបញ្ចូលរូបភាពក្រប
  const handleFileChangeCover = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCover(e.target.files[0]);
    }
  };

  const handleUploadCover = async () => {
    if (!cover) {
      message.error("សូមជ្រើសរើសឯកសារ");
      return;
    }

    const fileSize = cover.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const fileName = cover.name;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(fileSize, start + CHUNK_SIZE);

      const chunk = cover.slice(start, end);
      const res = await uploadChunk(chunk, i, totalChunks, fileName);

      setProgressCover(Math.round(((i + 1) / totalChunks) * 100));

      if (i === totalChunks - 1) {
        setCoverUri(res.data?.fileUrl);
      }
    }
  };

  // ស្វែងរក
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value === "") {
      fetchDocuments("");
    }
  };

  // ទាញយក Document នៅពេលទំព័របើកឡើង
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // ការកំណត់ស្ថមនឹងសម្រាប់តារាង Ant Design
  const columns: ColumnsType<Document> = [
    {
      title: "រូបភាពក្រប",
      dataIndex: "cover_uri",
      key: "cover_uri",
      render: (value) => (
        <Image
          width={60}
          src={`${import.meta.env.VITE_APP_ASSET_URL}/${value}`}
          alt="cover"
        />
      ),
    },
    {
      title: "ចំណងជើង",
      dataIndex: "title",
      key: "title",
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
          <Button type="primary" onClick={() => navigate(`/document/${record.id}`)}>
            គ្រូបង្រៀន
          </Button>
          <Button type="primary" onClick={() => openModal(record)}>
            កែប្រែ
          </Button>
          <Popconfirm
            title="តើអ្នកប្រាកដថាចង់លុប ឯកសារ?"
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
          onChange={handleSearch}
          className="w-1/4"
        />
        <Button type="primary" onClick={() => openModal()}>
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
        title={isEdit ? "កែប្រែឯកសារ" : "បង្កើតឯកសារ"}
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
            <p>រូបភាពក្រប</p>
            <input
              type="file"
              ref={fileInputRef}
              className="my-2 w-full"
              onChange={handleFileChangeCover}
            />
            <Button
              type="primary"
              onClick={handleUploadCover}
              disabled={!cover}
              block
            >
              បញ្ចូល
            </Button>
            {progressCover > 0 && (
              <Progress
                percent={progressCover}
                status={progressCover < 100 ? "active" : "success"}
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
              {isEdit ? "កែប្រែ" : "បង្កើត"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentPage;
