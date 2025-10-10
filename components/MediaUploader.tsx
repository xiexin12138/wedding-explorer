'use client';

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, Upload, Video, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { VideoThumbnail } from "@/components/OptimizedVideo";
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
  // 生成文件名：视频强制 .mp4，图片强制 .jpg
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const originalFileName = file.name;
  const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
  
  let ext: string;
  if (isVideo) {
    ext = '.mp4';
  } else if (isImage) {
    ext = '.jpg';
  } else {
    ext = originalFileName.substring(originalFileName.lastIndexOf('.'));
  }
  
  const key = `uploads/${crypto.randomUUID()}-${fileNameWithoutExt}${ext}`;
  
  console.log(`📤 上传文件: ${originalFileName} → ${key}`);
  if (isVideo && !originalFileName.endsWith('.mp4')) {
    console.log(`🎬 视频文件扩展名已自动转换为 .mp4`);
  }
  if (isImage && !originalFileName.endsWith('.jpg') && !originalFileName.endsWith('.jpeg')) {
    console.log(`🖼️ 图片文件扩展名已自动转换为 .jpg`);
  }
  
  return new Promise((resolve, reject) => {
    cos.sliceUploadFile(
      {
        Bucket: process.env.NEXT_PUBLIC_TENCENT_COS_BUCKET_NAME!,
        Region: process.env.NEXT_PUBLIC_TENCENT_COS_REGION!,
        Key: key,
        Body: file,
        // 移除 ACL 设置，保持存储桶的默认权限（私有）
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
        let finalUrl = `https://${data.Location}`;
        
        // 图片和视频上传后，远端会自动转码，返回转码后的 URL
        // 图片：自动转为 .jpg
        // 视频：自动转为 .mp4
        if (isImage) {
          // 确保返回的是 .jpg 格式的 URL（远端已转码）
          finalUrl = finalUrl.replace(/\.[^/.]+$/, '.jpg');
          console.log(`✅ 图片上传成功，返回转码后的 URL: ${finalUrl}`);
        } else if (isVideo) {
          // 确保返回的是 .mp4 格式的 URL（远端已转码）
          finalUrl = finalUrl.replace(/\.[^/.]+$/, '.mp4');
          console.log(`✅ 视频上传成功，返回转码后的 URL: ${finalUrl}`);
        } else {
          console.log(`✅ 上传成功: ${finalUrl}`);
        }
        
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
                    item.finalUrl && item.status === 'success' ? (
                      <OptimizedImage
                        src={item.finalUrl}
                        alt={item.file.name}
                        width={64}
                        height={64}
                        className="object-cover"
                        optimize={{ width: 200, quality: 75, format: 'webp' }}
                      />
                    ) : (
                      <Image src={item.previewUrl} alt={item.file.name} fill className="object-cover" unoptimized />
                    )
                  ) : (
                    item.finalUrl && item.status === 'success' ? (
                      <VideoThumbnail
                        src={item.finalUrl}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )
                  )}
                  {/* 类型标识 */}
                  {item.status === 'success' && (
                    <div className={cn(
                      "absolute bottom-0 right-0 p-0.5 rounded-tl",
                      item.file.type.startsWith('image/') ? "bg-blue-500/80" : "bg-purple-500/80"
                    )}>
                      {item.file.type.startsWith('image/') ? (
                        <ImageIcon className="w-3 h-3 text-white" />
                      ) : (
                        <Video className="w-3 h-3 text-white" />
                      )}
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
