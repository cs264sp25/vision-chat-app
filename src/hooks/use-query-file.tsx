import { FileType } from "@/types/file";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useQueryFile(fileId: string) {
  const file = useQuery(api.files.getOne, {
    fileId: fileId as Id<"files">,
  });

  return {
    data: file as FileType,
    loading: file === undefined,
    error: file === null,
  };
} 