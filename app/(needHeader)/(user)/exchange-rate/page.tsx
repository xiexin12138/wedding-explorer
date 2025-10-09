"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/components/UserProvider";
import { Coins, Gift, Plus, Pencil, Trash2, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, Clock, RefreshCw, Gavel } from "lucide-react";
import type { DictionaryItem } from "@/features/dictionary";
import {
  createDictionaryItemClient,
  deleteDictionaryItemClient,
  updateDictionaryItemClient,
} from "@/features/dictionary";
import { SettingValueType } from "@/app/generated/prisma";

// 场景类型
type SceneType = 'gift-exchange' | 'auction';

// 场景配置
interface SceneConfig {
  key: string;
  keyPrefix: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  itemLabel: string;        // 项目标签（礼物/行为）
  itemPlaceholder: string;  // 项目输入提示
  defaultEmoji: string;     // 默认表情
  tipText: string;          // 提示文本
}

const SCENE_CONFIGS: Record<SceneType, SceneConfig> = {
  'gift-exchange': {
    key: 'gift-exchange',
    keyPrefix: 'game_coin_item_',
    title: '礼物兑换',
    description: '游园会过程中赢取的游戏币可以兑换礼品',
    icon: <Gift className="h-5 w-5" />,
    itemLabel: '礼物名称',
    itemPlaceholder: '请输入礼物名称',
    defaultEmoji: '🎁',
    tipText: '游戏币可以在游园会各个游戏环节中赢取，赢取的游戏币可以兑换对应的礼品。汇率会根据活动进度实时调整，页面每10秒自动刷新，为您提供最新信息。',
  },
  'auction': {
    key: 'auction',
    keyPrefix: 'game_coin_auction_',
    title: '礼物拍卖',
    description: '在礼物拍卖环节，可以通过各种行为代替游戏币',
    icon: <Gavel className="h-5 w-5" />,
    itemLabel: '行为名称',
    itemPlaceholder: '请输入行为名称（如：喝酒、俯卧撑等）',
    defaultEmoji: '🍺',
    tipText: '在礼物拍卖环节，除了使用游戏币，您还可以通过完成特定行为来代替游戏币。汇率会根据活动进度实时调整，页面每10秒自动刷新，为您提供最新信息。',
  },
};

// 兑换项目数据结构
interface ExchangeItem {
  id: string;
  giftName: string;
  coinAmount: number;
  description: string;
  emoji?: string;
  sortOrder: number;
}

// 表单数据结构
interface FormData {
  giftName: string;
  coinAmount: string;
  description: string;
  emoji: string;
}

export default function ExchangeRatePage() {
  const [currentScene, setCurrentScene] = useState<SceneType>('gift-exchange');
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ExchangeItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'default'>('default');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const sceneConfig = SCENE_CONFIGS[currentScene];

  const [formData, setFormData] = useState<FormData>({
    giftName: "",
    coinAmount: "",
    description: "",
    emoji: sceneConfig.defaultEmoji,
  });

  // 设置页面标题
  useEffect(() => {
    document.title = "游戏币兑换汇率 - Xie & Feng Wedding";
  }, []);

  // 加载兑换项目
  const loadExchangeItems = async (scene: SceneType, isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // 使用公开的兑换项目 API（所有登录用户都可以访问）
      const response = await fetch(`/api/exchange-rate?scene=${scene}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // 禁用缓存，确保获取最新数据
      });

      if (!response.ok) {
        throw new Error("获取兑换项目失败");
      }

      const data = await response.json();
      
      // 转换数据格式
      const coinItems = data.map((item: DictionaryItem) => {
        try {
          const value = item.value ? JSON.parse(item.value) : {};
          return {
            id: item.id,
            giftName: value.giftName || item.displayName,
            coinAmount: value.coinAmount || 0,
            description: value.description || item.description || "",
            emoji: value.emoji || "🎁",
            sortOrder: item.sortOrder || 0,
          };
        } catch {
          // 如果 JSON 解析失败，返回默认值
          return {
            id: item.id,
            giftName: item.displayName,
            coinAmount: 0,
            description: item.description || "",
            emoji: "🎁",
            sortOrder: item.sortOrder || 0,
          };
        }
      });

      setExchangeItems(coinItems);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("获取兑换项目失败:", error);
      if (!isAutoRefresh) {
        toast({
          title: "获取兑换项目失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadExchangeItems(currentScene);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  // 自动刷新：每10秒更新一次
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadExchangeItems(currentScene, true);
    }, 10000); // 10秒

    // 清理定时器
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  // 强制更新显示的时间（每秒更新一次）
  const [, setTick] = useState(0);
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  const handleAdd = () => {
    setIsAddingNew(true);
    setEditingItem(null);
    setFormData({
      giftName: "",
      coinAmount: "",
      description: "",
      emoji: sceneConfig.defaultEmoji,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ExchangeItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setFormData({
      giftName: item.giftName,
      coinAmount: item.coinAmount.toString(),
      description: item.description,
      emoji: item.emoji || "🎁",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // 验证表单
    if (!formData.giftName || !formData.coinAmount) {
      toast({
        title: "保存失败",
        description: "请填写礼物名称和游戏币数量",
        variant: "destructive",
      });
      return;
    }

    const coinAmount = parseInt(formData.coinAmount);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      toast({
        title: "保存失败",
        description: "游戏币数量必须是正整数",
        variant: "destructive",
      });
      return;
    }

    try {
      // 构建 value JSON
      const valueJson = JSON.stringify({
        giftName: formData.giftName,
        coinAmount: coinAmount,
        description: formData.description,
        emoji: formData.emoji,
      });

      if (isAddingNew) {
        // 创建新兑换项目（根据当前场景使用不同的 key 前缀）
        const key = `${sceneConfig.keyPrefix}${Date.now()}`;
        await createDictionaryItemClient({
          key,
          displayName: formData.giftName,
          value: valueJson,
          description: formData.description,
          valueType: SettingValueType.JSON,
        });
        
        toast({
          title: "创建成功",
          description: `${sceneConfig.itemLabel} "${formData.giftName}" 已创建`,
        });
      } else if (editingItem) {
        // 更新兑换项目
        await updateDictionaryItemClient(editingItem.id, {
          displayName: formData.giftName,
          value: valueJson,
          description: formData.description,
          valueType: SettingValueType.JSON,
        });
        
        toast({
          title: "更新成功",
          description: `${sceneConfig.itemLabel} "${formData.giftName}" 已更新`,
        });
      }
      
      // 重新加载数据以获取最新状态
      await loadExchangeItems(currentScene);
    } catch (error) {
      console.error("保存兑换项目失败:", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
      return;
    }

    setIsDialogOpen(false);
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({
      giftName: "",
      coinAmount: "",
      description: "",
      emoji: "🎁",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDictionaryItemClient(id);
      toast({
        title: "删除成功",
        description: `${sceneConfig.itemLabel}已删除`,
      });
      // 重新加载数据以获取最新状态
      await loadExchangeItems(currentScene);
    } catch (error) {
      console.error("删除兑换项目失败:", error);
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({
      giftName: "",
      coinAmount: "",
      description: "",
      emoji: sceneConfig.defaultEmoji,
    });
  };

  // 切换场景时重置表单
  const handleSceneChange = (scene: SceneType) => {
    setCurrentScene(scene);
    // 重置排序
    setSortOrder('default');
  };

  const isAdmin = user?.isAdmin || false;

  // 格式化更新时间
  const formatUpdateTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `汇率更新时间：${hours}:${minutes}:${seconds}`;
  };

  // 手动刷新
  const handleManualRefresh = () => {
    loadExchangeItems(currentScene, true);
  };

  // 切换排序
  const toggleSort = () => {
    if (sortOrder === 'default') {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder('default');
    }
  };

  // 获取排序图标
  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortOrder === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  // 根据排序条件排序列表
  const sortedItems = [...exchangeItems].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.coinAmount - b.coinAmount;
    } else if (sortOrder === 'desc') {
      return b.coinAmount - a.coinAmount;
    }
    // default: 按照 sortOrder 排序（原始顺序）
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* 页面标题卡片 */}
      <Card className="mb-4 relative overflow-hidden border-amber-300/50 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-amber-950/20">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-4 right-4 text-amber-400 text-8xl">💰</div>
          <div className="absolute bottom-6 left-6 text-amber-400 text-6xl">🪙</div>
          <div className="absolute top-1/2 left-1/4 text-amber-400 text-5xl">🎁</div>
          <div className="absolute bottom-1/4 right-1/4 text-yellow-400 text-6xl">✨</div>
        </div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            游戏币兑换汇率
          </CardTitle>
          <CardDescription className="text-amber-800/80 dark:text-amber-200/70">
            游园会过程中赢取的游戏币可以兑换礼品，也可以用于最后的礼品拍卖
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 操作控制卡片 */}
      <Card className="mb-6 border-amber-200/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-1">
        <CardContent className="p-4">
          <Tabs value={currentScene} onValueChange={(value) => handleSceneChange(value as SceneType)} className="w-full">
            <div className="flex flex-col gap-4">
              {/* Tab 切换和管理按钮 */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <TabsList className="bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50 dark:border-amber-700/50 w-full sm:w-auto">
                  <TabsTrigger 
                    value="gift-exchange" 
                    className="flex items-center gap-1.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    <Gift className="h-4 w-4" />
                    <span className="font-medium">礼物兑换</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="auction"
                    className="flex items-center gap-1.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    <Gavel className="h-4 w-4" />
                    <span className="font-medium">礼物拍卖</span>
                  </TabsTrigger>
                </TabsList>
                
                {isAdmin && (
                  <Button
                    onClick={handleAdd}
                    className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white w-full sm:w-auto shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加{sceneConfig.itemLabel}
                  </Button>
                )}
              </div>
              
              {/* 场景描述 */}
              <div className="px-4 py-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
                <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                  {sceneConfig.description}
                </p>
              </div>
              
              {/* 排序、刷新按钮和更新时间 */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSort}
                    className="rounded-full border-2 border-amber-500/30 bg-amber-50/80 hover:bg-amber-100 hover:border-amber-500/50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-600/30 dark:hover:bg-amber-900/40 dark:hover:border-amber-600/50 dark:text-amber-200 transition-all shadow-sm"
                  >
                    {getSortIcon()}
                    <span className="ml-1.5 font-medium">
                      {sortOrder === 'asc' && '游戏币：少到多'}
                      {sortOrder === 'desc' && '游戏币：多到少'}
                      {sortOrder === 'default' && '默认排序'}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="rounded-full border-2 border-amber-500/30 bg-amber-50/80 hover:bg-amber-100 hover:border-amber-500/50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-600/30 dark:hover:bg-amber-900/40 dark:hover:border-amber-600/50 dark:text-amber-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="手动刷新"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="ml-1.5 font-medium">刷新</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/50 dark:bg-amber-900/20 border border-amber-300/30 dark:border-amber-700/30 w-fit">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    {formatUpdateTime(lastUpdateTime)}
                    {isRefreshing && <span className="ml-1.5 text-amber-600 dark:text-amber-400 animate-pulse">更新中</span>}
                  </span>
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* 添加/编辑模态框 */}
      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isAddingNew ? `添加${sceneConfig.itemLabel}` : `编辑${sceneConfig.itemLabel}`}
              </DialogTitle>
              <DialogDescription>
                {isAddingNew
                  ? `添加新的${sceneConfig.title}项目`
                  : `编辑现有的${sceneConfig.title}项目`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="giftName">{sceneConfig.itemLabel}</Label>
                  <Input
                    id="giftName"
                    value={formData.giftName}
                    onChange={(e) =>
                      setFormData({ ...formData, giftName: e.target.value })
                    }
                    placeholder={sceneConfig.itemPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coinAmount">游戏币数量</Label>
                  <Input
                    id="coinAmount"
                    type="number"
                    value={formData.coinAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, coinAmount: e.target.value })
                    }
                    placeholder="请输入游戏币数量"
                    min="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emoji">表情符号（可选）</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) =>
                    setFormData({ ...formData, emoji: e.target.value })
                  }
                  placeholder="🎁"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入描述"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 兑换项目列表 */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">加载中...</p>
          </CardContent>
        </Card>
      ) : exchangeItems.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            {currentScene === 'gift-exchange' ? (
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            ) : (
              <Gavel className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            )}
            <p className="text-gray-500">
              暂无{sceneConfig.title}项目
              {isAdmin && "，点击上方按钮添加"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => (
            <Card
              key={item.id}
              className="relative overflow-hidden border-amber-200/50 bg-gradient-to-br from-amber-50/50 via-yellow-50/50 to-amber-50/50 dark:from-amber-950/10 dark:via-yellow-950/10 dark:to-amber-950/10 hover:shadow-lg transition-shadow gap-2 py-3"
            >
              {/* 卡片装饰 */}
              <div className="absolute top-2 right-2 text-5xl opacity-20">
                {item.emoji}
              </div>
              
              <CardHeader className="relative z-10 pb-0 pt-0 px-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-100 leading-tight">
                        {item.giftName}
                      </CardTitle>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                          {item.coinAmount}
                        </span>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          游戏币
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 pt-0 pb-0 px-4">
                {item.description && (
                  <p className="text-xs text-amber-800/70 dark:text-amber-200/60 line-clamp-2 leading-snug mt-2">
                    {item.description}
                  </p>
                )}
                
                {isAdmin && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex-1 border-amber-400/50 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-400/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除兑换项目 &quot;{item.giftName}&quot;
                            吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      <Card className="mt-6 border-blue-200/50 bg-gradient-to-br from-blue-50/50 via-sky-50/50 to-blue-50/50 dark:from-blue-950/10 dark:via-sky-950/10 dark:to-blue-950/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900/80 dark:text-blue-100/70 font-medium mb-1">
                温馨提示
              </p>
              <p className="text-xs text-blue-800/70 dark:text-blue-200/60">
                {sceneConfig.tipText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

