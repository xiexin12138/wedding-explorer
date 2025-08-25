"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttractionMedia } from "@/components/AttractionCard";

interface MediaUploaderProps {
  media: AttractionMedia[];
  onMediaChange: (media: AttractionMedia[]) => void;
  className?: string;
}

export function MediaUploader({ media, onMediaChange, className }: MediaUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newMedia: AttractionMedia[] = [];
    
    Array.from(files).forEach((file) => {
      // 检查文件类型
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newMedia.push({
          type: 'image',
          url,
          title: file.name
        });
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        newMedia.push({
          type: 'video',
          url,
          title: file.name
        });
      }
    });

    onMediaChange([...media, ...newMedia]);
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 删除媒体文件
  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    onMediaChange(newMedia);
  };

  // 更新媒体标题
  const updateMediaTitle = (index: number, title: string) => {
    const newMedia = [...media];
    newMedia[index] = { ...newMedia[index], title };
    onMediaChange(newMedia);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label>媒体文件 (图片或视频，至少上传一个)</Label>
      
      {/* 上传区域 */}
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
        <p className="text-sm text-muted-foreground mb-1">
          点击或拖拽文件到此处上传
        </p>
        <p className="text-xs text-muted-foreground">
          支持图片和视频格式
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* 已上传的媒体文件列表 */}
      {media.length > 0 && (
        <div className="space-y-3">
          <Label>已上传的文件</Label>
          {media.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start gap-3">
                {/* 媒体预览 */}
                <div className="flex-shrink-0">
                  {item.type === 'image' ? (
                    <div className="relative w-16 h-16 bg-muted rounded overflow-hidden">
                      <Image
                        src={item.url}
                        alt={item.title || '图片预览'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <ImageIcon className="absolute top-1 left-1 h-4 w-4 text-white bg-black/50 rounded p-0.5" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* 媒体信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {item.type === 'image' ? '图片' : '视频'}
                    </span>
                  </div>
                  <Input
                    placeholder="输入媒体标题..."
                    value={item.title || ''}
                    onChange={(e) => updateMediaTitle(index, e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* 删除按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedia(index)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 验证提示 */}
      {media.length === 0 && (
        <p className="text-sm text-destructive">
          请至少上传一个图片或视频文件
        </p>
      )}
    </div>
  );
}