/**
 * 系统设置配置页面
 */
"use client";

import { useState, useEffect } from "react";
import { APP_NAME } from "@/lib/client-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingValueType } from "@/app/generated/prisma";
import { useToast } from "@/components/ui/use-toast";
import type { DictionaryItem } from "@/features/dictionary";
import {
  createDictionaryItemClient,
  deleteDictionaryItemClient,
  fetchDictionaryItems,
  updateDictionaryItemClient,
} from "@/features/dictionary";

type FormData = {
  key: string;
  displayName: string;
  value: string;
  description: string;
  valueType: SettingValueType;
};

export default function DictionaryConfigPage() {
  const [dictionaryItems, setDictionaryItems] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // 设置页面标题
  useEffect(() => {
    document.title = `数据字典管理 - ${APP_NAME}`;
  }, []);
  
  const [formData, setFormData] = useState<FormData>({
    key: "",
    displayName: "",
    value: "",
    description: "",
    valueType: SettingValueType.STRING,
  });

  // 加载字典项
  useEffect(() => {
    const loadDictionaryItems = async () => {
      try {
        setLoading(true);
        const data = await fetchDictionaryItems();
        setDictionaryItems(data);
      } catch (error) {
        console.error("获取字典项失败:", error);
        toast({
          title: "获取字典项失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDictionaryItems();
  }, [toast]);

  const handleAdd = () => {
    setIsAddingNew(true);
    setEditingItem(null);
    setJsonError("");
    setFormData({
      key: "",
      displayName: "",
      value: "",
      description: "",
      valueType: SettingValueType.STRING,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: DictionaryItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setJsonError("");
    // 如果是 JSON 或 ARRAY 类型，格式化显示
    let displayValue = item.value || "";
    if ((item.valueType === SettingValueType.JSON || item.valueType === SettingValueType.ARRAY) && displayValue) {
      try {
        const parsed = JSON.parse(displayValue);
        displayValue = JSON.stringify(parsed, null, 2);
      } catch {
        // 如果解析失败，保持原值
      }
    }
    setFormData({
      key: item.key,
      displayName: item.displayName,
      value: displayValue,
      description: item.description || "",
      valueType: item.valueType,
    });
    setIsDialogOpen(true);
  };

  // 验证 JSON 格式
  const validateJson = (value: string): boolean => {
    if (!value.trim()) {
      setJsonError("");
      return true;
    }
    try {
      JSON.parse(value);
      setJsonError("");
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "JSON 格式错误");
      return false;
    }
  };

  // 格式化 JSON
  const handleFormatJson = () => {
    if (!formData.value.trim()) return;
    try {
      const parsed = JSON.parse(formData.value);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormData({ ...formData, value: formatted });
      setJsonError("");
      toast({
        title: "格式化成功",
        description: "JSON 已格式化",
      });
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "JSON 格式错误");
      toast({
        title: "格式化失败",
        description: "请检查 JSON 格式是否正确",
        variant: "destructive",
      });
    }
  };

  // 处理值变化
  const handleValueChange = (value: string) => {
    setFormData({ ...formData, value });
    // 如果是 JSON 或 ARRAY 类型，实时验证
    if (formData.valueType === SettingValueType.JSON || formData.valueType === SettingValueType.ARRAY) {
      validateJson(value);
    }
  };

  // 处理类型变化
  const handleTypeChange = (valueType: SettingValueType) => {
    setFormData({ ...formData, valueType });
    setJsonError("");
    // 如果切换到 JSON 或 ARRAY 类型，验证当前值
    if ((valueType === SettingValueType.JSON || valueType === SettingValueType.ARRAY) && formData.value) {
      validateJson(formData.value);
    }
  };

  const handleSave = async () => {
    // 如果是 JSON 或 ARRAY 类型，先验证格式
    if ((formData.valueType === SettingValueType.JSON || formData.valueType === SettingValueType.ARRAY) && formData.value) {
      if (!validateJson(formData.value)) {
        toast({
          title: "保存失败",
          description: "请修正 JSON 格式错误",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      
      if (isAddingNew) {
        // 创建新字典项
        const newItem = await createDictionaryItemClient({
          key: formData.key,
          displayName: formData.displayName,
          value: formData.value || undefined,
          description: formData.description || undefined,
          valueType: formData.valueType,
        });
        
        setDictionaryItems((prev) =>
          [...prev, newItem].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
          )
        );
        toast({
          title: "✅ 创建成功",
          description: `字典项 "${formData.displayName}" 已创建`,
        });
      } else if (editingItem) {
        // 更新字典项
        const updatedItem = await updateDictionaryItemClient(editingItem.id, {
          key: formData.key,
          displayName: formData.displayName,
          value: formData.value || undefined,
          description: formData.description || undefined,
          valueType: formData.valueType,
        });
        
        setDictionaryItems((prev) =>
          prev
            .map((item) => (item.id === editingItem.id ? updatedItem : item))
            .sort(
              (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
            )
        );
        toast({
          title: "✅ 更新成功",
          description: `字典项 "${formData.displayName}" 已更新`,
        });
      }
      
      // 短暂延迟以让用户看到成功提示
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsDialogOpen(false);
      setIsAddingNew(false);
      setEditingItem(null);
      setFormData({
        key: "",
        displayName: "",
        value: "",
        description: "",
        valueType: SettingValueType.STRING,
      });
    } catch (error) {
      console.error("保存字典项失败:", error);
      toast({
        title: "❌ 保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      await deleteDictionaryItemClient(id);
      setDictionaryItems((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "✅ 删除成功",
        description: "字典项已删除",
      });
    } catch (error) {
      console.error("删除字典项失败:", error);
      toast({
        title: "❌ 删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setIsAddingNew(false);
    setEditingItem(null);
    setJsonError("");
    setFormData({
      key: "",
      displayName: "",
      value: "",
      description: "",
      valueType: SettingValueType.STRING,
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">系统设置配置</h1>
        <Button onClick={handleAdd}>添加系统设置</Button>
      </div>

      {/* 添加/编辑模态框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddingNew ? "添加系统设置" : "编辑系统设置"}</DialogTitle>
            <DialogDescription>
              {isAddingNew ? "添加新的系统设置项" : "编辑现有的系统设置项"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">键名</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="请输入键名"
                  disabled={editingItem?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">显示名称</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="请输入显示名称"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valueType">值类型</Label>
              <select
                id="valueType"
                value={formData.valueType}
                onChange={(e) =>
                  handleTypeChange(e.target.value as SettingValueType)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={SettingValueType.STRING}>字符串 (STRING)</option>
                <option value={SettingValueType.NUMBER}>数字 (NUMBER)</option>
                <option value={SettingValueType.BOOLEAN}>布尔值 (BOOLEAN)</option>
                <option value={SettingValueType.JSON}>JSON对象 (JSON)</option>
                <option value={SettingValueType.ARRAY}>数组 (ARRAY)</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="value">
                  键值
                  {(formData.valueType === SettingValueType.JSON || formData.valueType === SettingValueType.ARRAY) && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (需要有效的 JSON 格式)
                    </span>
                  )}
                </Label>
                {(formData.valueType === SettingValueType.JSON || formData.valueType === SettingValueType.ARRAY) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFormatJson}
                    className="h-7 text-xs"
                  >
                    格式化
                  </Button>
                )}
              </div>
              {formData.valueType === SettingValueType.JSON || formData.valueType === SettingValueType.ARRAY ? (
                <Textarea
                  id="value"
                  value={formData.value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder={
                    formData.valueType === SettingValueType.JSON
                      ? '请输入 JSON 对象，例如: {"key": "value"}'
                      : '请输入 JSON 数组，例如: ["item1", "item2"]'
                  }
                  className={`min-h-[120px] font-mono text-xs ${jsonError ? "border-red-500 dark:border-red-400" : ""}`}
                />
              ) : (
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder={
                    formData.valueType === SettingValueType.NUMBER
                      ? "请输入数字"
                      : formData.valueType === SettingValueType.BOOLEAN
                      ? "true 或 false"
                      : "请输入键值"
                  }
                  type={formData.valueType === SettingValueType.NUMBER ? "number" : "text"}
                />
              )}
              {jsonError && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{jsonError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="请输入描述"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent inline-block" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 字典项列表 */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {dictionaryItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1 sm:gap-2 lg:gap-4 flex-1">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        键名
                      </Label>
                      <p className="text-sm break-words">{item.key}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        显示名称
                      </Label>
                      <p className="text-sm break-words">{item.displayName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        键值
                      </Label>
                      <p className="text-sm break-words">{item.value}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        值类型
                      </Label>
                      <p className="text-sm break-words">{item.valueType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        描述
                      </Label>
                      <p className="text-sm break-words">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end lg:ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      编辑
                    </Button>
                    {!item.isSystem && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={isDeleting === item.id}
                          >
                            {isDeleting === item.id ? (
                              <>
                                <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent inline-block" />
                                删除中...
                              </>
                            ) : (
                              "删除"
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除字典项 &quot;{item.displayName}&quot;
                              吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting === item.id}>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting === item.id}
                            >
                              {isDeleting === item.id ? (
                                <>
                                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent inline-block" />
                                  删除中...
                                </>
                              ) : (
                                "删除"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {dictionaryItems.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">暂无系统设置项，点击上方按钮添加</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
