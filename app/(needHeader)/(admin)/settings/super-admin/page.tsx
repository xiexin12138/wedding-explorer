"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/UserProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Edit, Trash2, Loader2, GamepadIcon, Eye, EyeOff, Shield, Database, Users, Palette, Bell, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ButtonConfig = number | 'ADD_ANY' | 'DECLINE_ANY';

interface GameProject {
  id: string;
  name: string;
  description: string | null;
  costButtons: ButtonConfig[];
  rewardButtons: ButtonConfig[];
  isActive: boolean;
  sortOrder: number;
  totalGames: number;
  createdAt: string;
  updatedAt: string;
}

interface GameProjectForm {
  name: string;
  description: string;
  costButtons: ButtonConfig[];
  rewardButtons: ButtonConfig[];
  sortOrder: number;
}

interface ConfigModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  isComingSoon?: boolean;
  stats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
}

export default function SuperAdminConfigPage() {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [gameProjects, setGameProjects] = useState<GameProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<GameProject | null>(null);
  const [formData, setFormData] = useState<GameProjectForm>({
    name: "",
    description: "",
    costButtons: [],
    rewardButtons: [],
    sortOrder: 0,
  });
  
  // 用于编辑按钮配置的临时状态
  const [costButtonInput, setCostButtonInput] = useState<string>("");
  const [rewardButtonInput, setRewardButtonInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 配置模块定义
  const configModules: ConfigModule[] = [
    {
      id: "game-projects",
      title: "游戏项目配置",
      description: "管理游戏规则、奖励机制和项目设置",
      icon: <GamepadIcon className="h-6 w-6" />,
      isActive: true,
      stats: [
        { label: "活跃项目", value: gameProjects.filter(p => p.isActive).length, color: "text-green-600 dark:text-green-400" },
        { label: "总项目数", value: gameProjects.length, color: "text-blue-600 dark:text-blue-400" },
        { label: "总游戏次数", value: gameProjects.reduce((sum, p) => sum + p.totalGames, 0), color: "text-purple-600 dark:text-purple-400" }
      ]
    },
    {
      id: "user-management",
      title: "用户管理",
      description: "管理用户权限、角色分配和用户数据",
      icon: <Users className="h-6 w-6" />,
      isActive: false,
      isComingSoon: true,
      stats: [
        { label: "即将推出", value: "敬请期待", color: "text-gray-500" }
      ]
    },
    {
      id: "system-settings",
      title: "系统设置",
      description: "配置系统参数、安全策略和基础设置",
      icon: <Database className="h-6 w-6" />,
      isActive: false,
      isComingSoon: true,
      stats: [
        { label: "即将推出", value: "敬请期待", color: "text-gray-500" }
      ]
    },
    {
      id: "notifications",
      title: "通知管理",
      description: "配置系统通知、消息推送和提醒设置",
      icon: <Bell className="h-6 w-6" />,
      isActive: false,
      isComingSoon: true,
      stats: [
        { label: "即将推出", value: "敬请期待", color: "text-gray-500" }
      ]
    },
    {
      id: "analytics",
      title: "数据分析",
      description: "查看系统统计、用户行为和性能指标",
      icon: <BarChart3 className="h-6 w-6" />,
      isActive: false,
      isComingSoon: true,
      stats: [
        { label: "即将推出", value: "敬请期待", color: "text-gray-500" }
      ]
    },
    {
      id: "theme-settings",
      title: "主题设置",
      description: "自定义界面主题、色彩方案和视觉效果",
      icon: <Palette className="h-6 w-6" />,
      isActive: false,
      isComingSoon: true,
      stats: [
        { label: "即将推出", value: "敬请期待", color: "text-gray-500" }
      ]
    }
  ];

  // 获取游戏项目列表
  const fetchGameProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch('/api/admin/game-projects');
      const data = await response.json();

      if (data.success) {
        setGameProjects(data.data.gameProjects);
      } else {
        toast({
          title: "获取失败",
          description: data.error || "获取游戏项目列表失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('获取游戏项目列表失败:', error);
      toast({
        title: "获取失败",
        description: "获取游戏项目列表时发生错误",
        variant: "destructive",
      });
    } finally {
      setLoadingProjects(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && !loading) {
      fetchGameProjects();
    }
  }, [user, loading, fetchGameProjects]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      costButtons: [],
      rewardButtons: [],
      sortOrder: 0,
    });
    setCostButtonInput("");
    setRewardButtonInput("");
    setEditingProject(null);
  };

  // 打开新建对话框
  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (project: GameProject) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      costButtons: project.costButtons,
      rewardButtons: project.rewardButtons,
      sortOrder: project.sortOrder,
    });
    setCostButtonInput("");
    setRewardButtonInput("");
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  // 添加消耗按钮
  const handleAddCostButton = (type: 'number' | 'special') => {
    if (type === 'number') {
      const value = parseInt(costButtonInput);
      if (isNaN(value) || value < 0) {
        toast({
          title: "输入错误",
          description: "请输入有效的非负整数",
          variant: "destructive",
        });
        return;
      }
      setFormData({ ...formData, costButtons: [...formData.costButtons, value] });
      setCostButtonInput("");
    } else {
      if (!formData.costButtons.includes('DECLINE_ANY')) {
        setFormData({ ...formData, costButtons: [...formData.costButtons, 'DECLINE_ANY'] });
      }
    }
  };

  // 添加奖励按钮
  const handleAddRewardButton = (type: 'number' | 'special') => {
    if (type === 'number') {
      const value = parseInt(rewardButtonInput);
      if (isNaN(value) || value < 0) {
        toast({
          title: "输入错误",
          description: "请输入有效的非负整数",
          variant: "destructive",
        });
        return;
      }
      setFormData({ ...formData, rewardButtons: [...formData.rewardButtons, value] });
      setRewardButtonInput("");
    } else {
      if (!formData.rewardButtons.includes('ADD_ANY')) {
        setFormData({ ...formData, rewardButtons: [...formData.rewardButtons, 'ADD_ANY'] });
      }
    }
  };

  // 移除消耗按钮
  const handleRemoveCostButton = (index: number) => {
    setFormData({
      ...formData,
      costButtons: formData.costButtons.filter((_, i) => i !== index)
    });
  };

  // 移除奖励按钮
  const handleRemoveRewardButton = (index: number) => {
    setFormData({
      ...formData,
      rewardButtons: formData.rewardButtons.filter((_, i) => i !== index)
    });
  };

  // 格式化按钮显示
  const formatButton = (button: ButtonConfig): string => {
    if (button === 'ADD_ANY') return '自定义增加';
    if (button === 'DECLINE_ANY') return '自定义减少';
    return button.toString();
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "验证失败",
        description: "请输入项目名称",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingProject 
        ? `/api/admin/game-projects/${editingProject.id}` 
        : '/api/admin/game-projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: editingProject ? "更新成功" : "创建成功",
          description: `游戏项目已${editingProject ? "更新" : "创建"}`,
        });
        setIsDialogOpen(false);
        resetForm();
        fetchGameProjects();
      } else {
        toast({
          title: editingProject ? "更新失败" : "创建失败",
          description: data.error || "操作失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast({
        title: "提交失败",
        description: "提交时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除项目
  const handleDelete = async (project: GameProject) => {
    try {
      const response = await fetch(`/api/admin/game-projects/${project.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "删除成功",
          description: "游戏项目已删除",
        });
        fetchGameProjects();
      } else {
        toast({
          title: "删除失败",
          description: data.error || "删除失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: "删除失败",
        description: "删除时发生错误",
        variant: "destructive",
      });
    }
  };

  // 切换项目状态
  const handleToggleStatus = async (project: GameProject) => {
    try {
      const response = await fetch(`/api/admin/game-projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...project,
          isActive: !project.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "状态更新成功",
          description: `项目已${!project.isActive ? "启用" : "禁用"}`,
        });
        fetchGameProjects();
      } else {
        toast({
          title: "状态更新失败",
          description: data.error || "更新状态失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      toast({
        title: "状态更新失败",
        description: "更新状态时发生错误",
        variant: "destructive",
      });
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">正在验证权限...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 非超级管理员提示
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">无访问权限</CardTitle>
            <CardDescription className="text-base">
              抱歉，您不是超级管理员，无法访问此页面
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }


  // 渲染游戏项目配置内容
  const renderGameProjectsContent = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">游戏项目配置</h2>
          <p className="text-sm md:text-base text-muted-foreground">管理游戏规则、奖励机制和项目设置</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 w-full md:w-auto">
          <Plus className="h-4 w-4" />
          新建项目
        </Button>
      </div>

      {/* 游戏项目列表 */}
      {loadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      ) : gameProjects.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-12">
            <GamepadIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              暂无游戏项目
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              点击&quot;新建项目&quot;按钮创建第一个游戏项目
            </p>
            <Button onClick={handleCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              开始创建
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {gameProjects.map((project) => (
            <Card key={project.id} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="pt-4 md:pt-6">
                <div className="space-y-3">
                  {/* 项目头部 */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GamepadIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base md:text-lg font-semibold truncate">{project.name}</h3>
                        <Badge variant={project.isActive ? "default" : "secondary"} className="text-xs">
                          {project.isActive ? "启用" : "禁用"}
                        </Badge>
                        {project.totalGames > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {project.totalGames} 次
                          </Badge>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* 项目信息 */}
                  <div className="space-y-2 text-xs md:text-sm bg-muted/30 rounded-lg p-2 md:p-3">
                    <div className="flex items-start gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400 flex-shrink-0 mt-1"></div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">消耗按钮: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.costButtons.map((btn, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {formatButton(btn)}
                            </Badge>
                          ))}
                          {project.costButtons.length === 0 && <span className="text-muted-foreground">无</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400 flex-shrink-0 mt-1"></div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">奖励按钮: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.rewardButtons.map((btn, idx) => (
                            <Badge key={idx} variant="default" className="text-xs bg-green-600 dark:bg-green-700 dark:hover:bg-green-600">
                              {formatButton(btn)}
                            </Badge>
                          ))}
                          {project.rewardButtons.length === 0 && <span className="text-muted-foreground">无</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0"></div>
                      <span className="truncate">排序: {project.sortOrder}</span>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(project)}
                      className="gap-1 flex-1 md:flex-none"
                    >
                      {project.isActive ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span className="hidden md:inline">禁用</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          <span className="hidden md:inline">启用</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(project)}
                      className="gap-1 flex-1 md:flex-none"
                    >
                      <Edit className="h-3 w-3" />
                      <span className="hidden md:inline">编辑</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive flex-1 md:flex-none"
                          disabled={project.totalGames > 0}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden md:inline">删除</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除游戏项目 &quot;{project.name}&quot; 吗？此操作不可撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(project)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      )}
    </div>
  );

  // 渲染即将推出的功能
  const renderComingSoonContent = (module: ConfigModule) => {
    return (
      <div className="text-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-6">
          {module?.icon}
        </div>
        <h2 className="text-2xl font-bold mb-2">{module?.title}</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {module?.description}
        </p>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          即将推出，敬请期待
        </Badge>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">超级管理员</h1>
            <p className="text-sm md:text-base text-muted-foreground">系统配置与管理中心</p>
          </div>
        </div>
      </div>

      {/* 配置模块标签页 */}
      <Tabs defaultValue="game-projects" className="w-full">
        <div className="overflow-x-auto mb-6">
          <TabsList className="inline-flex w-auto h-auto p-1 gap-1">
            {configModules.map((module) => (
              <TabsTrigger 
                key={module.id} 
                value={module.id}
                disabled={module.isComingSoon}
                className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="h-4 w-4 flex-shrink-0">{module.icon}</span>
                <span className="text-sm font-medium whitespace-nowrap">{module.title}</span>
                {module.isComingSoon && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-current">
                    即将
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 游戏项目配置 */}
        <TabsContent value="game-projects" className="mt-0">
          <Card>
            <CardContent className="p-4 md:p-6">
              {renderGameProjectsContent()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 其他即将推出的模块 */}
        {configModules.filter(m => m.isComingSoon).map((module) => (
          <TabsContent key={module.id} value={module.id} className="mt-0">
            <Card>
              <CardContent className="p-4 md:p-6">
                {renderComingSoonContent(module)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* 新建/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GamepadIcon className="h-5 w-5" />
              {editingProject ? "编辑游戏项目" : "新建游戏项目"}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? "修改游戏项目的配置信息" : "创建一个新的游戏项目"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入项目名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入项目描述（可选）"
                rows={3}
              />
            </div>
            
            {/* 消耗按钮配置 */}
            <div className="grid gap-2">
              <Label>消耗游戏币按钮配置</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={costButtonInput}
                    onChange={(e) => setCostButtonInput(e.target.value)}
                    placeholder="输入数字"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddCostButton('number')}
                    variant="outline"
                    size="sm"
                  >
                    添加数字
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleAddCostButton('special')}
                    variant="outline"
                    size="sm"
                  >
                    添加自定义
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-muted/30 dark:bg-muted/20">
                  {formData.costButtons.map((btn, idx) => (
                    <Badge
                      key={idx}
                      variant="destructive"
                      className="cursor-pointer hover:bg-destructive/80 gap-1"
                      onClick={() => handleRemoveCostButton(idx)}
                    >
                      {formatButton(btn)}
                      <span className="text-xs">×</span>
                    </Badge>
                  ))}
                  {formData.costButtons.length === 0 && (
                    <span className="text-xs text-muted-foreground">暂无按钮，点击上方添加</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击按钮可删除。示例: [1, 3, 5, 自定义减少]
                </p>
              </div>
            </div>

            {/* 奖励按钮配置 */}
            <div className="grid gap-2">
              <Label>奖励游戏币按钮配置</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={rewardButtonInput}
                    onChange={(e) => setRewardButtonInput(e.target.value)}
                    placeholder="输入数字"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddRewardButton('number')}
                    variant="outline"
                    size="sm"
                  >
                    添加数字
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleAddRewardButton('special')}
                    variant="outline"
                    size="sm"
                  >
                    添加自定义
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-muted/30 dark:bg-muted/20">
                  {formData.rewardButtons.map((btn, idx) => (
                    <Badge
                      key={idx}
                      variant="default"
                      className="cursor-pointer hover:opacity-80 gap-1 bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
                      onClick={() => handleRemoveRewardButton(idx)}
                    >
                      {formatButton(btn)}
                      <span className="text-xs">×</span>
                    </Badge>
                  ))}
                  {formData.rewardButtons.length === 0 && (
                    <span className="text-xs text-muted-foreground">暂无按钮，点击上方添加</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  点击按钮可删除。示例: [1, 3, 5, 自定义增加]
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sortOrder">排序权重</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在{editingProject ? "更新" : "创建"}...
                </>
              ) : (
                editingProject ? "更新" : "创建"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}