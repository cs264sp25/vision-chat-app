import { CreateFileType } from "@/types/file";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Id } from "convex/_generated/dataModel";

export function useMutationFiles() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createMutation = useMutation(api.files.create);
  const deleteMutation = useMutation(api.files.remove);

  const createFile = async (
    fileMeta: CreateFileType,
  ): Promise<string | null> => {
    try {
      const { file, ...rest } = fileMeta;

      if (!file) {
        throw new Error("File is required");
      }

      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file!.type },
        body: file,
      });

      // Step 3: Get the storage id from the response
      const { storageId } = await result.json();

      // Determine the file type based on MIME type
      const fileType = file.type.startsWith("image/") ? "image" : "other";

      // Step 4: Save the file metadata to the database
      const fileId = await createMutation({
        ...rest,
        storageId,
        type: fileType, // Set the determined type
      });

      return fileId;
    } catch (error) {
      toast((error as Error).message || "Please try again later");
      return null;
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      await deleteMutation({
        fileId: fileId as Id<"files">,
      });
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Failed to delete file");
      return false;
    }
  };

  return {
    add: createFile,
    delete: deleteFile,
  };
}
