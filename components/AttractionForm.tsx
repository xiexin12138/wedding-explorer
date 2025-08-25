"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttractionType, AttractionDetail, AttractionMedia } from "@/components/AttractionCard";
import { attractionTypeConfig } from "@/components/MapExplorer";
import { MediaUploader } from "@/components/MediaUploader";

interface AttractionFormProps {
  position: [number, number]; // 当前地图中心位置
  onSubmit: (attraction: AttractionDetail) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  type: AttractionType;
  unlockDistance: number;
  media: AttractionMedia[];
}

interface FormErrors {
  name?: string;
  description?: string;
  media?: string;
  unlockDistance?: string;
}

export function AttractionForm({ position, onSubmit, onCancel }: AttractionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: AttractionType.SCENIC,
    unlockDistance: 100,
    media: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 验证景点名称
    if (!formData.name.trim()) {
      newErrors.name = '请输入景点名称';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '景点名称至少需要2个字符';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '景点名称不能超过50个字符';
    }

    // 验证景点描述
    if (!formData.description.trim()) {
      newErrors.description = '请输入景点描述';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = '景点描述至少需要5个字符';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = '景点描述不能超过200个字符';
    }

    // 验证媒体文件
    if (formData.media.length === 0) {
      newErrors.media = '请至少上传一个图片或视频文件';
    }

    // 验证解锁距离
    if (formData.unlockDistance < 10) {
      newErrors.unlockDistance = '解锁距离不能小于10米';
    } else if (formData.unlockDistance > 1000) {
      newErrors.unlockDistance = '解锁距离不能大于1000米';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 创建新景点对象
      const newAttraction: AttractionDetail = {
        id: `attraction-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        position: position,
        unlockDistance: formData.unlockDistance,
        media: formData.media
      };

      // 提交表单
      onSubmit(newAttraction);
    } catch (error) {
      console.error('提交景点信息失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 更新表单数据
  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[300]">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background shadow-xl">
        <div className="p-6">
          {/* 表单标题 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">添加新景点</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 位置信息显示 */}
          <div className="mb-6 p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium">景点位置</Label>
            <p className="text-sm text-muted-foreground mt-1">
              经度: {position[0].toFixed(6)}, 纬度: {position[1].toFixed(6)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              位置将基于当前地图中心点确定
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 景点名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">景点名称 *</Label>
              <Input
                id="name"
                placeholder="请输入景点名称"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* 景点描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">景点描述 *</Label>
              <textarea
                id="description"
                placeholder="请输入景点描述"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className={cn(
                  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                  errors.description && "border-destructive"
                )}
                rows={3}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{errors.description && <span className="text-destructive">{errors.description}</span>}</span>
                <span>{formData.description.length}/200</span>
              </div>
            </div>

            {/* 景点类型 */}
            <div className="space-y-2">
              <Label>景点类型 *</Label>
              <div className="flex flex-wrap gap-2">
                {Object.values(AttractionType).map((type) => {
                  const config = attractionTypeConfig[type];
                  const isSelected = formData.type === type;
                  return (
                    <Badge
                      key={type}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected
                          ? config.className
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      onClick={() => updateFormData('type', type)}
                    >
                      {config.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* 解锁距离 */}
            <div className="space-y-2">
              <Label htmlFor="unlockDistance">解锁距离 (米) *</Label>
              <Input
                id="unlockDistance"
                type="number"
                min="10"
                max="1000"
                step="10"
                placeholder="100"
                value={formData.unlockDistance}
                onChange={(e) => updateFormData('unlockDistance', parseInt(e.target.value) || 100)}
                className={cn(errors.unlockDistance && "border-destructive")}
              />
              {errors.unlockDistance && (
                <p className="text-sm text-destructive">{errors.unlockDistance}</p>
              )}
              <p className="text-xs text-muted-foreground">
                用户需要在此距离范围内才能解锁查看景点详情
              </p>
            </div>

            {/* 媒体文件上传 */}
            <MediaUploader
              media={formData.media}
              onMediaChange={(media) => updateFormData('media', media)}
            />
            {errors.media && (
              <p className="text-sm text-destructive">{errors.media}</p>
            )}

            {/* 提交按钮 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存景点
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}