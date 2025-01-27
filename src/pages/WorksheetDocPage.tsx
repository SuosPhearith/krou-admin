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
import { MdOutlineRemoveRedEye } from "react-icons/md";
import moment from "moment";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { ImArrowLeft } from "react-icons/im";
const CHUNK_SIZE = 2 * 1024 * 1024;
const { confirm } = Modal;

// ប្រភេទ WorksheetDoc
interface WorksheetDoc {
  id: number;
  title: string;
  description?: string;
  cover_uri: string;
  published_date: string;
  coming_from: string;
  lecturer: string;
  file_uri: string;
  status: boolean;
}

const WorksheetPage = () => {
  // ស្ថានភាព
  const { id } = useParams<{ id: string }>();
  const [worksheetDocs, setWorksheets] = useState<WorksheetDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentWorksheet, setCurrentWorksheet] = useState<WorksheetDoc | null>(
    null
  );
  const [form] = Form.useForm();
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 500);

  // ទាញយក WorksheetDoc
  const fetchWorksheets = async (searchValue: string = search) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        data: WorksheetDoc[];
        total: number;
        current_page: number;
      }>(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/worksheet-documents?search=${searchValue}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setWorksheets(response.data.data);
      setTotal(response.data.total);
      setPage(response.data.current_page);
    } catch (error) {
      console.error(error);
      message.error("ការទាញយក សន្លឹកកិច្ចការ បានបរាជ័យ");
    } finally {
      setLoading(false);
    }
  };

  // បើក Modal
  const openModal = (worksheetDoc: WorksheetDoc | null = null) => {
    setIsModalOpen(true);
    setIsEdit(!!worksheetDoc);
    setCurrentWorksheet(worksheetDoc);
    if (worksheetDoc) {
      form.setFieldsValue(worksheetDoc);
    } else {
      form.resetFields();
    }
  };

  // បិទ Modal
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for file input
  const coverInputRef = useRef<HTMLInputElement | null>(null); // Ref for cover input
  const closeModal = () => {
    // Close the modal
    setIsModalOpen(false);

    // Reset state variables
    setCurrentWorksheet(null);
    setFile(null);
    setCover(null);
    setFileUri("");
    setCoverUri("");
    setProgressFile(0);
    setProgressCover(0);

    // Reset form fields
    form.resetFields();

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
    if (coverInputRef.current) coverInputRef.current.value = ""; // Clear cover input

    console.log("Modal closed and file inputs reset.");
  };

  // ដោះស្រាយការដាក់ស្នើ Form
  const handleFormSubmit = async (values: Omit<WorksheetDoc, "id">) => {
    try {
      if (isEdit && currentWorksheet) {
        await axios.put(
          `${import.meta.env.VITE_APP_API_URL}/api/worksheet-documents/update/${
            currentWorksheet.id
          }`,
          {
            ...values,
            file_uri: fileUri,
            cover_uri: coverUri,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        message.success("កែប្រែ សន្លឹកកិច្ចការ បានជោគជ័យ");
      } else {
        if (!fileUri || !coverUri) {
          message.error("Please seleted file!");
          return;
        }
        await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/api/worksheet-documents/create`,
          {
            ...values,
            file_uri: fileUri,
            cover_uri: coverUri,
            worksheets_id: id,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        message.success("បង្កើត សន្លឹកកិច្ចការ បានជោគជ័យ");
      }
      fetchWorksheets();
      closeModal();
    } catch (error) {
      console.error(error);
      message.error("ការរក្សាទុក សន្លឹកកិច្ចការ បានបរាជ័យ");
    }
  };

  // ដោះស្រាយការលុប
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/worksheet-documents/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      message.success("លុប សន្លឹកកិច្ចការ បានជោគជ័យ");
      fetchWorksheets();
    } catch (error) {
      console.error(error);
      message.error("ការលុប សន្លឹកកិច្ចការ បានបរាជ័យ");
    }
  };

  // ស្វែងរក
  useEffect(() => {
    fetchWorksheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // ======================================>File<=========================================
  // State
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [progressFile, setProgressFile] = useState<number>(0);
  const [progressCover, setProgressCover] = useState<number>(0);
  const [fileUri, setFileUri] = useState("");
  const [coverUri, setCoverUri] = useState("");

  // Handle file change
  const handleFileChangeFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  // Handle file change
  const handleFileChangeCover = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCover(e.target.files[0]);
    }
  };

  // Handle upload process
  const handleUploadFile = async () => {
    if (!file) {
      message.error("Please selete file");
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

      // Update progress
      setProgressFile(Math.round(((i + 1) / totalChunks) * 100));

      if (i === totalChunks - 1) {
        setFileUri(res.data?.fileUrl);
      }
    }
  };

  const handleUploadCover = async () => {
    if (!cover) {
      message.error("Please selete file");
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

      // Update progress
      setProgressCover(Math.round(((i + 1) / totalChunks) * 100));
      if (i === totalChunks - 1) {
        setCoverUri(res.data?.fileUrl);
      }
    }
  };

  const handleStatusChange = async (id: number) => {
    confirm({
      title: "តើអ្នកពិតជាចង់ប្តូរមែនទេ?",
      icon: <ExclamationCircleFilled />,
      content: "សូមបញ្ជាក់ថាអ្នកចង់ប្តូរស្ថានភាពដោយប្រយ័ត្ន!",
      okText: "បាទ/ចាស",
      cancelText: "ទេ",
      async onOk() {
        try {
          // Make the API request to toggle the status
          await axios.patch(
            `${
              import.meta.env.VITE_APP_API_URL
            }/api/worksheet-documents/toggle-status/${id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
          message.success("ស្ថានភាពត្រូវបានប្តូរដោយជោគជ័យ!");
          fetchWorksheets();
        } catch (error) {
          console.error(error);
          message.error("មានបញ្ហាក្នុងការប្តូរស្ថានភាព!");
        }
      },
    });
  };

  // ======================================>File<=========================================

  // ទាញយក WorksheetDoc នៅពេលទំព័របើកឡើង
  useEffect(() => {
    fetchWorksheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ការកំណត់ស្ថមនឹងសម្រាប់តារាង Ant Design
  const columns: ColumnsType<WorksheetDoc> = [
    {
      title: "រូបភាពក្រប",
      dataIndex: "cover_uri",
      key: "cover_uri",
      render: (value) => {
        return (
          <>
            <Image
              width={60}
              src={`${import.meta.env.VITE_APP_ASSET_URL}/${value}`}
              alt="cover"
            />
          </>
        );
      },
    },
    {
      title: "ចំណងជើង",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "គ្រូបង្រៀន",
      dataIndex: "lecturer",
      key: "lecturer",
    },
    {
      title: "មកពី",
      dataIndex: "coming_from",
      key: "coming_from",
    },
    {
      title: "បោះពុម្ពផ្សាយ",
      dataIndex: "published_date",
      key: "published_date",
      render: (published_date) =>
        published_date
          ? moment(published_date).format("YYYY-MM-DD")
          : "No Date",
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
          checked={status === 1}
          onChange={() => {
            handleStatusChange(record.id);
          }}
          checkedChildren="សកម្ម"
          unCheckedChildren="មិនសកម្ម"
        />
      ),
    },
    {
      title: "ថ្ងៃបង្កើត",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) =>
        created_at
          ? moment(created_at).format("YYYY-MM-DD HH:mm:ss")
          : "No Date",
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
            title="តើអ្នកប្រាកដថាចង់លុប សន្លឹកកិច្ចការ នេះមែនទេ?"
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
          បង្កើតសន្លឹកកិច្ចការ
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={worksheetDocs}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total: total,
          onChange: (page) => {
            setPage(page);
          },
        }}
      />

      {/* Modal សម្រាប់បង្កើត/កែប្រែ */}
      <Modal
        maskClosable={false}
        title={isEdit ? "កែប្រែ សន្លឹកកិច្ចការ" : "បង្កើត សន្លឹកកិច្ចការ"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          {/* Row 1 */}
          <div className="flex gap-4">
            <Form.Item
              name="title"
              label="ចំណងជើង"
              className="flex-1"
              rules={[{ required: true, message: "សូមបញ្ចូលចំណងជើង" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="description" label="ការពិពណ៌នា" className="flex-1">
              <Input />
            </Form.Item>
          </div>

          {/* Row 2 */}
          <div className="flex gap-4">
            <Form.Item
              name="published_date"
              label="កាលបរិច្ឆេទបោះពុម្ពផ្សាយ"
              className="flex-1"
              rules={[
                {
                  required: true,
                  message: "សូមបញ្ចូលកាលបរិច្ឆេទបោះពុម្ពផ្សាយ",
                },
              ]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              name="coming_from"
              label="មកពី"
              className="flex-1"
              rules={[{ required: true, message: "សូមបញ្ចូលប្រភព" }]}
            >
              <Input />
            </Form.Item>
          </div>

          {/* Row 3 */}
          <div className="flex gap-4">
            <Form.Item
              name="lecturer"
              label="គ្រូបង្រៀន"
              className="flex-1"
              rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះគ្រូបង្រៀន" }]}
            >
              <Input />
            </Form.Item>
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <p>ក្របរូបភាព</p>
              <input
                type="file"
                ref={coverInputRef}
                className="my-2 w-full"
                onChange={handleFileChangeCover}
              />

              <Button
                type="primary"
                onClick={handleUploadCover}
                disabled={!cover || progressCover != 0}
                block
              >
                Upload
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
            <div className="w-1/2">
              <p>ឯកសារ</p>
              <input
                type="file"
                ref={fileInputRef}
                className="my-2 w-full"
                onChange={handleFileChangeFile}
              />
              <Button
                type="primary"
                onClick={handleUploadFile}
                disabled={!file || progressFile != 0}
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
          </div>

          {/* Submit Button */}
          <div className="w-full flex justify-end mt-4">
            <Form.Item>
              <Button onClick={closeModal} className="me-3">
                បោះបង់
              </Button>
              <Button type="primary" htmlType="submit">
                {isEdit ? "កែប្រែ" : "បង្កើត"}
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default WorksheetPage;
