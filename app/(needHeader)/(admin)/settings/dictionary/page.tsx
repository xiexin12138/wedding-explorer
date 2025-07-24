/**
 * 数据字典配置页面
 */
"use client";

import { useState } from "react";
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

interface DictionaryItem {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
}

export default function DictionaryConfigPage() {
  const [dictionaryItems, setDictionaryItems] = useState<DictionaryItem[]>([
    {
      id: "1",
      key: "wedding_status",
      value: "筹备中",
      description: "婚礼状态",
      category: "状态",
    },
    {
      id: "2",
      key: "venue_type",
      value: "酒店",
      description: "场地类型",
      category: "场地",
    },
  ]);

  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: "",
    category: "",
  });

  const handleAdd = () => {
    setIsAddingNew(true);
    setEditingItem(null);
    setFormData({ key: "", value: "", description: "", category: "" });
  };

  const handleEdit = (item: DictionaryItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setFormData({
      key: item.key,
      value: item.value,
      description: item.description,
      category: item.category,
    });
  };

  const handleSave = () => {
    if (isAddingNew) {
      const newItem: DictionaryItem = {
        id: Date.now().toString(),
        ...formData,
      };
      setDictionaryItems([...dictionaryItems, newItem]);
    } else if (editingItem) {
      setDictionaryItems(
        dictionaryItems.map((item) =>
          item.id === editingItem.id ? { ...editingItem, ...formData } : item
        )
      );
    }
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({ key: "", value: "", description: "", category: "" });
  };

  const handleDelete = (id: string) => {
    setDictionaryItems(dictionaryItems.filter((item) => item.id !== id));
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({ key: "", value: "", description: "", category: "" });
  };

  return (
    <div className="container mx-auto ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">数据字典配置</h1>
        <Button onClick={handleAdd}>添加字典项</Button>
      </div>

      {/* 添加/编辑表单 */}
      {(isAddingNew || editingItem) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{isAddingNew ? "添加字典项" : "编辑字典项"}</CardTitle>
            <CardDescription>
              {isAddingNew ? "添加新的数据字典项" : "编辑现有的数据字典项"}
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
                />
              </div>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="请输入分类"
                />
              </div>
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
      <div className="grid gap-4">
        {dictionaryItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-4 flex-1">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      键名
                    </Label>
                    <p className="text-sm break-words">{item.key}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      键值
                    </Label>
                    <p className="text-sm break-words">{item.value}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      描述
                    </Label>
                    <p className="text-sm break-words">{item.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      分类
                    </Label>
                    <p className="text-sm break-words">{item.category}</p>
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
                          确定要删除字典项 &quot;{item.key}&quot;
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dictionaryItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">暂无数据字典项，点击上方按钮添加</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
