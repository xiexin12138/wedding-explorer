'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttractionType, AttractionDetail } from "@/components/AttractionCard";
import { attractionTypeConfig } from "@/components/MapExplorer";
import { MediaUploader, UploadableFile, uploadFile } from "@/components/MediaUploader";
import COS from 'cos-js-sdk-v5';

interface AttractionFormProps {
  position: [number, number];
  onSubmitSuccess: (attraction: AttractionDetail) => void;
  onCancel: () => void;
  editingAttraction?: AttractionDetail; // 如果传入此参数，则为编辑模式
}

export function AttractionForm({ position, onSubmitSuccess, onCancel, editingAttraction }: AttractionFormProps) {
  const isEditMode = !!editingAttraction;
  
  const [name, setName] = useState(editingAttraction?.name || '');
  const [description, setDescription] = useState(editingAttraction?.description || '');
  const [type, setType] = useState<AttractionType>(editingAttraction?.type || AttractionType.SCENIC);
  const [unlockDistance, setUnlockDistance] = useState(editingAttraction?.unlockDistance || 100);
  const [rewardCoins] = useState(editingAttraction?.rewardCoins || 10); // 默认奖励10金币（金币功能已屏蔽，但保留后端数据）
  
  // 初始化已有的媒体文件（编辑模式）
  const [mediaFiles, setMediaFiles] = useState<UploadableFile[]>(() => {
    if (editingAttraction?.media) {
      return editingAttraction.media.map((item, index) => ({
        id: `existing-${index}`,
        file: new File([], item.title || 'media', { type: item.type === 'image' ? 'image/jpeg' : 'video/mp4' }),
        previewUrl: item.url,
        status: 'success' as const,
        progress: 100,
        finalUrl: item.url,
      }));
    }
    return [];
  });
  
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    if (!name.trim()) newErrors.name = '请输入景点名称';
    if (!description.trim()) newErrors.description = '请输入景点描述';
    if (mediaFiles.length === 0) newErrors.media = '请至少上传一个图片或视频文件';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newUploads: UploadableFile[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));
    setMediaFiles(prev => [...prev, ...newUploads]);
  };

  const handleFileRemoved = (id: string) => {
    setMediaFiles(prev => prev.filter(m => m.id !== id));
  };

  const updateFileProgress = (id: string, progress: number) => {
    setMediaFiles(prev => prev.map(m => m.id === id ? { ...m, progress } : m));
  };

  const updateFileStatus = (id: string, status: UploadableFile['status'], finalUrl?: string, errorMessage?: string) => {
    setMediaFiles(prev => prev.map(m => m.id === id ? { ...m, status, finalUrl, errorMessage, progress: status === 'success' ? 100 : m.progress } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 1. 获取临时密钥
      const stsResponse = await fetch('/api/upload', { method: 'POST' });
      if (!stsResponse.ok) throw new Error('获取上传授权失败');
      const stsData = await stsResponse.json();

      const cos = new COS({
        getAuthorization: (options, callback) => {
          callback({
            TmpSecretId: stsData.Credentials.TmpSecretId,
            TmpSecretKey: stsData.Credentials.TmpSecretKey,
            XCosSecurityToken: stsData.Credentials.Token,
            StartTime: stsData.StartTime,
            ExpiredTime: stsData.ExpiredTime,
          });
        }
      });

      // 2. 上传所有待处理的文件
      const uploadPromises = mediaFiles
        .filter(m => m.status === 'pending')
        .map(async (mediaFile) => {
          try {
            updateFileStatus(mediaFile.id, 'uploading');
            const finalUrl = await uploadFile(cos, mediaFile.file, (progress) => {
              updateFileProgress(mediaFile.id, progress);
            });
            updateFileStatus(mediaFile.id, 'success', finalUrl);
            return { url: finalUrl, type: mediaFile.file.type.startsWith('image/') ? 'image' : 'video', title: mediaFile.file.name };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '上传失败';
            updateFileStatus(mediaFile.id, 'error', undefined, errorMessage);
            throw error;
          }
        });

      const uploadedMedia = await Promise.all(uploadPromises);
      
      const existingSuccessMedia = mediaFiles
        .filter(m => m.status === 'success' && m.finalUrl)
        .map(m => ({ url: m.finalUrl!, type: m.file.type.startsWith('image/') ? 'image' : 'video', title: m.file.name }));

      const allFinalMedia = [...existingSuccessMedia, ...uploadedMedia];

      // 3. 提交景点数据到后端
      const attractionPayload = {
        name: name.trim(),
        description: description.trim(),
        type: type,
        position: position,
        unlockDistance: unlockDistance,
        rewardCoins: rewardCoins, // 使用用户设置的金币奖励数额
        media: allFinalMedia
      };

      let response;
      if (isEditMode && editingAttraction) {
        // 编辑模式：使用 PATCH 请求
        response = await fetch(`/api/attractions/${editingAttraction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attractionPayload)
        });
      } else {
        // 新建模式：使用 POST 请求
        response = await fetch('/api/attractions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attractionPayload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存景点信息失败');
      }

      const result = await response.json();
      
      // 防御性检查
      if (typeof onSubmitSuccess !== 'function') {
        console.error('onSubmitSuccess is not a function:', onSubmitSuccess);
        throw new Error('回调函数未定义');
      }
      
      onSubmitSuccess(result.data);

    } catch (error) {
      console.error('提交失败:', error);
      const errorMessage = error instanceof Error ? error.message : '发生未知错误';
      setErrors(prev => ({ ...prev, form: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[300]">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{isEditMode ? '编辑景点' : '添加新景点'}</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}><X className="h-4 w-4" /></Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">{errors.form}</p>}
            
            <div className="space-y-2">
              <Label htmlFor="name">景点名称 *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">景点描述 *</Label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label>景点类型 *</Label>
              <div className="flex flex-wrap gap-2">
                {Object.values(AttractionType).map((t) => (
                  <Badge key={t} className={cn("cursor-pointer", type === t ? attractionTypeConfig[t].className : "bg-muted text-muted-foreground")} onClick={() => setType(t)}>
                    {attractionTypeConfig[t].label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unlockDistance">解锁距离 (米) *</Label>
              <Input 
                id="unlockDistance" 
                type="number" 
                min="10"
                max="1000"
                value={unlockDistance} 
                onChange={(e) => setUnlockDistance(parseInt(e.target.value) || 100)} 
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">用户在此范围内可打卡</p>
            </div>

            <MediaUploader
              mediaFiles={mediaFiles}
              onFilesSelected={handleFilesSelected}
              onFileRemoved={handleFileRemoved}
            />
            {errors.media && <p className="text-sm text-destructive">{errors.media}</p>}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>取消</Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEditMode ? '更新中...' : '提交中...'}</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />{isEditMode ? '保存修改' : '保存景点'}</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}