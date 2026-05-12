import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Button } from "../ui/button";

type FileUploaderProps = {
  fieldChange: (FILES: File[]) => void;
  mediaUrl: string;
  multiple?: boolean;
};

const FileUploader = ({ fieldChange, mediaUrl, multiple = false }: FileUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(mediaUrl ? [mediaUrl] : []);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setFiles(acceptedFiles);
      fieldChange(acceptedFiles);
      setPreviews(acceptedFiles.map((f) => URL.createObjectURL(f)));
    },
    []
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg"] },
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className="flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer"
    >
      <input {...getInputProps()} className="cursor-pointer" />
      {previews.length > 0 ? (
        <>
          {previews.length === 1 ? (
            <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
              <img src={previews[0]} alt="image" className="file_uploader-img" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 p-5 justify-center w-full">
              {previews.map((url, i) => (
                <img key={i} src={url} alt={`photo ${i + 1}`} className="h-24 w-24 object-cover rounded-lg ring-1 ring-primary-500/20" />
              ))}
            </div>
          )}
          <p className="file_uploader-label">
            {files.length > 1 ? `${files.length} photos selected — click to change` : "Click or drag photo to replace"}
          </p>
        </>
      ) : (
        <div className="file_uploader-box">
          <img src="/assets/icons/file-upload.svg" alt="file-upload" width={96} height={77} />
          <h3 className="base-medium text-light-2 mb-2 mt-6">
            {multiple ? "Drag photos here" : "Drag photo here"}
          </h3>
          <p className="text-light-4 small-regular mb-6">
            {multiple ? "SVG, PNG, JPG — up to 10 photos" : "SVG, PNG, JPG"}
          </p>
          <Button className="shad-button_dark_4">Select from device</Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
