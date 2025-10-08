/**
 * 系统设置配置页面
 */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { SystemSetting, SettingValueType } from "@/app/generated/prisma";
import { useToast } from "@/components/ui/use-toast";
import {
  getAllDictionaryItems,
  createDictionaryItem,
  updateDictionaryItem,
  deleteDictionaryItem,
} from "@/lib/services/dictionary";

type DictionaryItem = SystemSetting;

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

  // 设置页面标题
  useEffect(() => {
    document.title = "数据字典管理 - Xie & Feng Wedding";
  }, []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    key: "",
    displayName: "",
    value: "",
    description: "",
    valueType: SettingValueType.STRING,
  });

  // 加载字典项
  useEffect(() => {
    const fetchDictionaryItems = async () => {
      try {
        setLoading(true);
        const data = await getAllDictionaryItems();
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

    fetchDictionaryItems();
  }, [toast]);

  const handleAdd = () => {
    setIsAddingNew(true);
    setEditingItem(null);
    setFormData({
      key: "",
      displayName: "",
      value: "",
      description: "",
      valueType: SettingValueType.STRING,
    });
  };

  const handleEdit = (item: DictionaryItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setFormData({
      key: item.key,
      displayName: item.displayName,
      value: item.value || "",
      description: item.description || "",
      valueType: item.valueType,
    });
  };

  const handleSave = async () => {
    try {
      if (isAddingNew) {
        // 创建新字典项
        const newItem = await createDictionaryItem({
          key: formData.key,
          displayName: formData.displayName,
          value: formData.value,
          description: formData.description,
          valueType: formData.valueType,
        });
        
        setDictionaryItems([...dictionaryItems, newItem]);
        toast({
          title: "创建成功",
          description: `字典项 "${formData.displayName}" 已创建`,
        });
      } else if (editingItem) {
        // 更新字典项
        const updatedItem = await updateDictionaryItem(editingItem.id, {
          key: formData.key,
          displayName: formData.displayName,
          value: formData.value,
          description: formData.description,
        });
        
        setDictionaryItems(
          dictionaryItems.map((item) =>
            item.id === editingItem.id ? updatedItem : item
          )
        );
        toast({
          title: "更新成功",
          description: `字典项 "${formData.displayName}" 已更新`,
        });
      }
    } catch (error) {
      console.error("保存字典项失败:", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({
      key: "",
      displayName: "",
      value: "",
      description: "",
      valueType: SettingValueType.STRING,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDictionaryItem(id);
      setDictionaryItems(dictionaryItems.filter((item) => item.id !== id));
      toast({
        title: "删除成功",
        description: "字典项已删除",
      });
    } catch (error) {
      console.error("删除字典项失败:", error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingItem(null);
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

      {/* 添加/编辑表单 */}
      {(isAddingNew || editingItem) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{isAddingNew ? "添加系统设置" : "编辑系统设置"}</CardTitle>
            <CardDescription>
              {isAddingNew ? "添加新的系统设置项" : "编辑现有的系统设置项"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">键值</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="请输入键值"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valueType">值类型</Label>
                <select
                  id="valueType"
                  value={formData.valueType}
                  onChange={(e) =>
                    setFormData({ ...formData, valueType: e.target.value as SettingValueType })
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
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button onClick={handleSave} className="flex-1 sm:flex-none">
                保存
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none"
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 字典项列表 */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">加载中...</p>
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
                      <Label className="text-sm font-medium text-gray-500">
                        键名
                      </Label>
                      <p className="text-sm break-words">{item.key}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        显示名称
                      </Label>
                      <p className="text-sm break-words">{item.displayName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        键值
                      </Label>
                      <p className="text-sm break-words">{item.value}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        值类型
                      </Label>
                      <p className="text-sm break-words">{item.valueType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
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
                          <Button variant="destructive" size="sm">
                            删除
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
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                            >
                              删除
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
                <p className="text-gray-500">暂无系统设置项，点击上方按钮添加</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
