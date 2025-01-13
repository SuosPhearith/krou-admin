import { api } from "../services/share";
import { CreateWorksheetData } from "../services/type";

export const createWorksheet = async (data: CreateWorksheetData) => {
  const response = await api("POST", "/api/worksheets", data);
  return response.data;
};
