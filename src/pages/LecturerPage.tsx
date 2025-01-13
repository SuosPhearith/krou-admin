import { useState, useEffect, ChangeEvent } from "react";
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
} from "antd";
import { ColumnsType } from "antd/es/table";
import useDebounce from "../apis/share";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";

const { confirm } = Modal;

// ប្រភេទ Lecturer
interface Lecturer {
  id: number;
  name: string;
  coming_from: string;
  status: boolean;
  documents_id: string;
}

const LecturerPage = () => {
  // ស្ថានភាព
  const { id } = useParams<{ id: string }>();
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [currentLecturer, setCurrentLecturer] = useState<Lecturer | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 500);
  const navigate = useNavigate()

  // ទាញយក Lecturer
  const fetchLecturers = async (searchValue: string = search) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        data: Lecturer[];
        total: number;
        current_page: number;
      }>(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/lecturers?search=${searchValue}&page=${page}&&documents_id=${id}`
      );
      setLecturers(response.data.data);
      setTotal(response.data.total);
      setPage(response.data.current_page);
    } catch (error) {
      console.error(error);
      message.error("ការទាញយកអ្នកបង្រៀន បានបរាជ័យ");
    } finally {
      setLoading(false);
    }
  };

  // បើក Modal
  const openModal = (lecturer: Lecturer | null = null) => {
    setIsModalOpen(true);
    setIsEdit(!!lecturer);
    setCurrentLecturer(lecturer);
    if (lecturer) {
      form.setFieldsValue(lecturer);
    } else {
      form.resetFields();
    }
  };

  // បិទ Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLecturer(null);
    form.resetFields();
  };

  // ដោះស្រាយការដាក់ស្នើ Form
  const handleFormSubmit = async (values: Omit<Lecturer, "id">) => {
    try {
      if (isEdit && currentLecturer) {
        await axios.put(
          `${import.meta.env.VITE_APP_API_URL}/api/lecturers/update/${
            currentLecturer.id
          }`,
          { ...values, documents_id: id }
        );
        message.success("ការកែប្រែអ្នកបង្រៀន បានជោគជ័យ");
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/api/lecturers/create`,
          { ...values, documents_id: id }
        );
        message.success("បង្កើតអ្នកបង្រៀន បានជោគជ័យ");
      }
      fetchLecturers();
      closeModal();
    } catch (error) {
      console.error(error);
      message.error("ការរក្សាទុកអ្នកបង្រៀន បានបរាជ័យ");
    }
  };

  // ដោះស្រាយការលុប
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/api/lecturers/delete/${id}`
      );
      message.success("ការលុបអ្នកបង្រៀន បានជោគជ័យ");
      fetchLecturers();
    } catch (error) {
      console.error(error);
      message.error("ការលុបអ្នកបង្រៀន បានបរាជ័យ");
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
            }/api/lecturers/toggle-status/${id}`
          );
          message.success("ការប្តូរស្ថានភាព បានជោគជ័យ");
          fetchLecturers();
        } catch (error) {
          console.error(error);
          message.error("ការប្តូរស្ថានភាព បានបរាជ័យ");
        }
      },
    });
  };

  // ស្វែងរក
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value === "") {
      fetchLecturers("");
    }
  };

  // ទាញយក Lecturer នៅពេលទំព័របើកឡើង
  useEffect(() => {
    fetchLecturers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // ការកំណត់ស្ថមនឹងសម្រាប់តារាង Ant Design
  const columns: ColumnsType<Lecturer> = [
    {
      title: "ឈ្មោះ",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "មកពី",
      dataIndex: "coming_from",
      key: "coming_from",
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
          <Button type="primary" onClick={() => navigate(`/lecturer/${record.id}`)}>
            វីដេអូ
          </Button>
          <Button type="primary" onClick={() => openModal(record)}>
            កែប្រែ
          </Button>
          <Popconfirm
            title="តើអ្នកប្រាកដថាចង់លុប អ្នកបង្រៀន?"
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
          បង្កើតអ្នកបង្រៀន
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={lecturers}
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
        title={isEdit ? "កែប្រែអ្នកបង្រៀន" : "បង្កើតអ្នកបង្រៀន"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="name"
            label="ឈ្មោះ"
            rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះ" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="coming_from"
            label="មកពី"
            rules={[{ required: true, message: "សូមបញ្ចូលទីកន្លែងមកពី" }]}
          >
            <Input />
          </Form.Item>

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

export default LecturerPage;
