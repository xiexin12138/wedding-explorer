'use client';

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, Upload, Video, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import COS from 'cos-js-sdk-v5';

// 定义上传文件的状态和结构
export interface UploadableFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  finalUrl?: string;
  errorMessage?: string;
}

// 定义最终提交给后端的媒体对象结构
export interface FinalMedia {
  type: 'image' | 'video';
  url: string;
  title: string;
}

// 新的、具备断点续传能力的上传工具函数
export const uploadFile = (
  cos: COS,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  const key = `uploads/${crypto.randomUUID()}-${file.name}`;
  
  return new Promise((resolve, reject) => {
    cos.sliceUploadFile(
      {
        Bucket: process.env.NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME!,
        Region: process.env.NEXT_PUBLIC_TENCENT_COS_REGION!,
        Key: key,
        Body: file,
        onProgress: (progressData) => {
          const percent = Math.round(progressData.percent * 100);
          onProgress(percent);
        },
      },
      (err, data) => {
        if (err) {
          return reject(err);
        }
        // data.Location 包含完整的 URL
        const finalUrl = `https://${data.Location}`;
        resolve(finalUrl);
      }
    );
  });
};


interface MediaUploaderProps {
  mediaFiles: UploadableFile[];
  onFilesSelected: (files: FileList | null) => void;
  onFileRemoved: (id: string) => void;
  className?: string;
}

// MediaUploader 现在是一个更纯粹的UI组件
export function MediaUploader({ 
  mediaFiles, 
  onFilesSelected, 
  onFileRemoved, 
  className 
}: MediaUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onFilesSelected(e.dataTransfer.files);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary hover:bg-primary/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">点击或拖拽文件到此处上传</p>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => onFilesSelected(e.target.files)} />
      </div>

      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          <Label>上传列表</Label>
          {mediaFiles.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="relative w-16 h-16 bg-muted rounded overflow-hidden">
                  {item.file.type.startsWith('image/') ? (
                    <Image src={item.previewUrl} alt={item.file.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.status === 'pending' && <span>等待上传</span>}
                    {item.status === 'uploading' && <><Loader2 className="h-4 w-4 animate-spin" /><span>上传中... {item.progress}%</span></>}
                    {item.status === 'success' && <><CheckCircle2 className="h-4 w-4 text-green-500" /><span>上传成功</span></>}
                    {item.status === 'error' && <><AlertCircle className="h-4 w-4 text-destructive" /><span>上传失败</span></>}
                  </div>
                  {item.status === 'error' && <p className="text-xs text-destructive truncate">{item.errorMessage}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => onFileRemoved(item.id)} className="flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
