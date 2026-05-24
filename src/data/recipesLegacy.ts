/**
 * 本地精品菜谱（80 道手写 RAW），供 legacy 回退与 catalog 合并去重。
 */
import type { Recipe } from '../types/recipe'

export const RAW: Recipe[] = [
  // ==================== 红烧 / 炖煮（10 道）====================
  {
    id: 1,
    title: '红烧肉',
    quote: '苏东坡被贬黄州时发明了东坡肉，"慢着火，少着水，火候足时它自美"',
    rating: 4.9, count: 3500, emoji: '🥩',
    difficulty: '复杂', time: 70, tags: ['红烧', '大菜', '肉类'],
    ingredients: [
      { name: '五花肉', amount: '500g' }, { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '3勺' }, { name: '老抽', amount: '1勺' },
      { name: '八角', amount: '2个' }, { name: '桂皮', amount: '1小块' },
      { name: '葱', amount: '2根' }, { name: '生姜', amount: '4片' },
    ],
    steps: [
      { content: '五花肉切 3cm 方块，冷水入锅，加葱、姜、料酒，大火煮沸后撇净浮沫，捞出沥干备用。', time: 8, tip: '焯水去腥是红烧肉软烂不柴的第一步' },
      { content: '锅内少量油，放冰糖，小火持续翻炒至糖完全溶化变成深琥珀色，注意观察，颜色过深会苦。', time: 5, tip: '糖色要炒到「枣红色」，这是红烧肉颜色的关键' },
      { content: '迅速放入肉块，中火翻炒让每块肉都裹上糖色，约 2 分钟。', time: 2 },
      { content: '加入生抽、老抽、八角、桂皮，翻炒均匀后加热水（或啤酒）没过肉面。', time: 3, tip: '加啤酒代替水，香味更浓郁' },
      { content: '大火烧开后转小火，盖锅盖炖 50 分钟至肉软糯，开盖大火收汁至浓稠发亮。', time: 55, tip: '收汁时不停翻动，防止粘锅' },
    ],
    nutritionAnalysis: '五花肉富含胶原蛋白，小火慢炖后脂肪大量溶入汤汁，口感软糯不腻。'
  },
  {
    id: 2,
    title: '可乐鸡翅',
    quote: '可乐鸡翅是中国本土化创意菜，1980 年代诞生，如今是家庭餐桌上出镜率最高的菜之一',
    rating: 4.8, count: 2800, emoji: '🍗',
    difficulty: '简单', time: 35, tags: ['红烧', '鸡翅', '家常'],
    ingredients: [
      { name: '鸡翅中', amount: '500g' }, { name: '可乐', amount: '330ml（1罐）' },
      { name: '生抽', amount: '2勺' }, { name: '老抽', amount: '1勺' },
      { name: '生姜', amount: '3片' }, { name: '八角', amount: '1个' },
    ],
    steps: [
      { content: '鸡翅洗净，在两面各划两刀，帮助入味；冷水入锅，加姜片，大火煮沸后焯水 2 分钟，捞出冲洗干净。', time: 8, tip: '划刀是关键，否则翅根厚处很难熟透入味' },
      { content: '锅中少量油，中火将鸡翅两面煎至金黄，约各 2 分钟，表皮收紧后倒入可乐。', time: 6, tip: '煎出金黄色可以锁住肉汁' },
      { content: '加生抽、老抽、八角，中大火烧开后转中小火，加盖焖煮 15 分钟。', time: 18, tip: '选普通可乐，无糖版颜色偏浅' },
      { content: '开盖大火收汁，期间不断翻动，直到汤汁浓稠、鸡翅表面亮滑，撒葱花出锅。', time: 5, tip: '收汁时留意别煳锅，时刻翻动' },
    ],
    nutritionAnalysis: '鸡翅蛋白质丰富，可乐提供焦糖色与甜味，小火慢炖后口感软嫩脱骨。'
  },
  {
    id: 3,
    title: '黄焖鸡米饭',
    quote: '黄焖鸡起源于山东济南，后经全国连锁扩张成为「米饭杀手」，香浓汤汁是最大魅力',
    rating: 4.9, count: 4200, emoji: '🍲',
    difficulty: '中等', time: 45, tags: ['红烧', '鸡肉', '下饭'],
    ingredients: [
      { name: '鸡腿', amount: '2个（约 500g）' }, { name: '土豆', amount: '1个' },
      { name: '香菇', amount: '6朵（干）' }, { name: '青椒', amount: '1个' },
      { name: '郫县豆瓣酱', amount: '1勺' }, { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' }, { name: '大蒜', amount: '5瓣' },
    ],
    steps: [
      { content: '干香菇提前泡发 30 分钟，鸡腿剁小块；土豆切滚刀块；青椒切片；大蒜拍扁备用。', time: 8, tip: '香菇泡发水不要倒掉，用来炖鸡味道更香' },
      { content: '锅内油烧热，放鸡块中火翻炒至表皮金黄，逼出多余油脂，约 5 分钟。', time: 6 },
      { content: '加大蒜、豆瓣酱，中火炒出红油，香气扑鼻后放土豆、香菇翻炒均匀。', time: 4, tip: '豆瓣酱要炒出红油才够香' },
      { content: '倒入香菇水和足量热水（水量没过食材），加生抽、老抽，大火烧开后转中火加盖焖 20 分钟。', time: 22 },
      { content: '放入青椒，大火收汁 3 分钟，汤汁浓稠即可出锅配白米饭。', time: 4, tip: '青椒最后放，保持脆爽口感' },
    ],
    nutritionAnalysis: '鸡腿含丰富蛋白质，土豆提供碳水，香浓汤汁浇在米饭上绝对下饭。'
  },
  {
    id: 4,
    title: '土豆炖牛肉',
    quote: '牛腩含丰富的肌间脂肪和结缔组织，长时间炖煮后胶原蛋白溶出，汤汁浓厚绵润',
    rating: 4.8, count: 1900, emoji: '🥩',
    difficulty: '中等', time: 90, tags: ['炖煮', '牛肉', '大菜'],
    ingredients: [
      { name: '牛腩', amount: '500g' }, { name: '土豆', amount: '2个' },
      { name: '胡萝卜', amount: '1根' }, { name: '洋葱', amount: '半个' },
      { name: '生抽', amount: '3勺' }, { name: '老抽', amount: '1勺' },
      { name: '番茄酱', amount: '1勺' }, { name: '大蒜', amount: '4瓣' },
    ],
    steps: [
      { content: '牛腩切 3cm 方块，冷水下锅，加葱段、姜片，大火煮沸焯水 3 分钟，撇净浮沫，捞出冲洗备用。', time: 8 },
      { content: '热锅下油，放洋葱、大蒜中火炒香，加番茄酱翻炒 1 分钟，放入牛腩翻炒上色。', time: 6, tip: '番茄酱增加酸香，能使牛肉更快软烂' },
      { content: '加生抽、老抽炒匀，倒热水没过牛肉，大火烧开后转小火炖 60 分钟。', time: 65 },
      { content: '加入土豆、胡萝卜块，继续炖 20 分钟至软烂入味，加盐调味即可。', time: 22, tip: '土豆不要太早放，否则会化掉' },
    ],
    nutritionAnalysis: '牛肉富含铁和蛋白质，土豆补充碳水，炖煮后营养充分融合。'
  },
  {
    id: 5,
    title: '红烧排骨',
    quote: '猪肋排含丰富的骨胶原，长时间炖煮后骨头里的矿物质溶入汤中，是天然的补钙好食材',
    rating: 4.7, count: 2100, emoji: '🍖',
    difficulty: '中等', time: 60, tags: ['红烧', '排骨', '大菜'],
    ingredients: [
      { name: '猪排骨', amount: '500g' }, { name: '冰糖', amount: '20g' },
      { name: '生抽', amount: '3勺' }, { name: '老抽', amount: '1勺' },
      { name: '料酒', amount: '2勺' }, { name: '生姜', amount: '4片' },
    ],
    steps: [
      { content: '排骨剁 4cm 段，冷水入锅，加料酒和姜片，大火烧开焯水 3 分钟，捞出洗净。', time: 8 },
      { content: '锅中少量油，小火炒冰糖至琥珀色，放入排骨大火翻炒上色。', time: 6, tip: '糖色要到位，颜色才好看' },
      { content: '加生抽、老抽炒匀，加热水没过排骨，放姜片，大火烧开转小火炖 40 分钟。', time: 45 },
      { content: '开盖大火收汁至浓稠发亮，撒葱花出锅。', time: 5 },
    ],
    nutritionAnalysis: '骨髓富含磷脂和脂肪，炖煮后汤汁浓郁，配饭特别香。'
  },
  {
    id: 6,
    title: '红烧鱼',
    quote: '中国有「无鱼不成宴」的说法，鱼与「余」谐音，红烧鱼是年夜饭必备的吉祥菜',
    rating: 4.8, count: 2300, emoji: '🐟',
    difficulty: '中等', time: 30, tags: ['红烧', '鱼类', '家常'],
    ingredients: [
      { name: '草鱼', amount: '1条（约 600g）' }, { name: '生抽', amount: '3勺' },
      { name: '老抽', amount: '1勺' }, { name: '番茄酱', amount: '1勺' },
      { name: '大蒜', amount: '4瓣' }, { name: '生姜', amount: '4片' },
      { name: '葱', amount: '3根' },
    ],
    steps: [
      { content: '草鱼处理干净，两面各划 3 刀，用盐和料酒腌制 10 分钟，用厨房纸吸干表面水分。', time: 12, tip: '一定要吸干水分，否则下锅会粘底溅油' },
      { content: '锅烧热后倒入较多油，将鱼两面煎至金黄定型，约各 3 分钟，小心翻面。', time: 8, tip: '锅要充分预热，鱼才不会粘' },
      { content: '放蒜、姜、葱炒香，加生抽、老抽、番茄酱炒匀，倒入热水没过鱼身一半。', time: 4 },
      { content: '大火烧开后转中火，加盖焖 10 分钟，开盖大火收汁，撒葱花出锅。', time: 12, tip: '汁要收得浓稠才够味' },
    ],
    nutritionAnalysis: '草鱼蛋白质含量高达 17%，脂肪少，红烧不会太腻。'
  },
  {
    id: 7,
    title: '卤鸡腿',
    quote: '卤制的秘诀在于「老卤」——每次卤完留下汤汁，下次再用，越卤越香，这叫「万年卤水」',
    rating: 4.7, count: 1600, emoji: '🍗',
    difficulty: '简单', time: 50, tags: ['卤煮', '鸡腿', '家常'],
    ingredients: [
      { name: '鸡腿', amount: '3个' }, { name: '生抽', amount: '4勺' },
      { name: '老抽', amount: '2勺' }, { name: '冰糖', amount: '15g' },
      { name: '八角', amount: '2个' }, { name: '香叶', amount: '3片' },
      { name: '生姜', amount: '4片' },
    ],
    steps: [
      { content: '鸡腿洗净，用刀在厚肉处刺几刀，冷水下锅焯水 2 分钟，捞出冲净。', time: 6 },
      { content: '锅中加水约 500ml，放所有调料，大火烧开。', time: 5 },
      { content: '放入鸡腿，转中小火加盖卤 30 分钟，关火后浸泡 10 分钟再捞出。', time: 42, tip: '浸泡让入味更深，别急着捞' },
      { content: '捞出后刷一层香油，斩块装盘，卤汁可留用。', time: 3 },
    ],
    nutritionAnalysis: '鸡腿肉质鲜嫩，卤制后脂肪含量适中，蛋白质丰富，老少皆宜。'
  },
  {
    id: 8,
    title: '糖醋里脊',
    quote: '糖醋里脊源于鲁菜「糖醋鲤鱼」，在江浙沪地区演化为酥炸里脊版，是孩子最爱的下饭菜',
    rating: 4.8, count: 1900, emoji: '🍖',
    difficulty: '中等', time: 35, tags: ['糖醋', '炸菜', '下饭'],
    ingredients: [
      { name: '里脊肉', amount: '300g' }, { name: '番茄酱', amount: '3勺' },
      { name: '白糖', amount: '2勺' }, { name: '白醋', amount: '2勺' },
      { name: '生粉', amount: '4勺' }, { name: '鸡蛋', amount: '1个' },
    ],
    steps: [
      { content: '里脊肉切 1cm 厚条，用盐、料酒腌制 10 分钟；鸡蛋打散，与生粉调成均匀蛋糊。', time: 12, tip: '蛋糊稠度以能挂在肉条上不滴落为准' },
      { content: '肉条裹蛋糊，下六七成热油锅（约 180°C），中火炸至金黄定型，捞出。', time: 6, tip: '第一次炸是为了定型，不用太久' },
      { content: '油温升到八成热，复炸 30 秒使外皮更酥脆，捞出控油。', time: 2, tip: '复炸是外酥里嫩的关键' },
      { content: '另起锅，番茄酱、白糖、白醋、少量水调成酱汁，中火熬至浓稠起泡，倒入肉条快速翻匀出锅。', time: 4, tip: '酱汁要熬浓，裹上肉条才亮晶晶' },
    ],
    nutritionAnalysis: '里脊肉脂肪少，外层酥脆，酸甜口味十分开胃，偶尔吃是不错的享受。'
  },
  {
    id: 9,
    title: '番茄炖牛腩',
    quote: '番茄中的番茄红素是脂溶性营养素，与富含脂肪的牛腩一起炖，吸收率大幅提升',
    rating: 4.8, count: 2000, emoji: '🍅',
    difficulty: '中等', time: 90, tags: ['炖煮', '牛肉', '番茄'],
    ingredients: [
      { name: '牛腩', amount: '500g' }, { name: '番茄', amount: '3个（约 400g）' },
      { name: '洋葱', amount: '半个' }, { name: '大蒜', amount: '4瓣' },
      { name: '生抽', amount: '2勺' }, { name: '番茄酱', amount: '2勺' },
    ],
    steps: [
      { content: '牛腩切块冷水焯水，撇沫捞出；番茄切块，洋葱切丁，大蒜拍扁备用。', time: 10 },
      { content: '热锅下油，炒香洋葱和大蒜，放番茄块大火翻炒出汁，加番茄酱。', time: 6, tip: '番茄炒出汁是汤底香浓的关键' },
      { content: '放入牛腩翻炒，加生抽，倒足量热水没过食材，大火烧开。', time: 5 },
      { content: '转小火加盖炖 70 分钟至牛腩软烂，加盐调味，撒香菜出锅。', time: 72, tip: '炖的时间越长牛腩越软糯' },
    ],
    nutritionAnalysis: '番茄提供维生素 C 和番茄红素，牛腩提供优质蛋白，是营养全面的家常汤菜。'
  },
  {
    id: 10,
    title: '啤酒鸭',
    quote: '啤酒中的麦芽糖和酒花成分可以去腥提鲜，同时让鸭肉更加软嫩，还能带出独特麦香',
    rating: 4.7, count: 1400, emoji: '🦆',
    difficulty: '中等', time: 60, tags: ['炖煮', '鸭肉', '大菜'],
    ingredients: [
      { name: '鸭腿', amount: '2个（约 600g）' }, { name: '啤酒', amount: '330ml（1罐）' },
      { name: '郫县豆瓣酱', amount: '1勺' }, { name: '生抽', amount: '2勺' },
      { name: '大蒜', amount: '5瓣' }, { name: '生姜', amount: '5片' },
    ],
    steps: [
      { content: '鸭腿剁块，冷水下锅加葱姜焯水 5 分钟，撇净浮沫，捞出备用。', time: 8, tip: '鸭肉腥味重，焯水要彻底' },
      { content: '锅中少量油，放姜蒜中火炒香，加豆瓣酱炒出红油，放鸭块翻炒上色。', time: 6, tip: '豆瓣酱炒出红油是关键，颜色才好看' },
      { content: '倒入整罐啤酒，加生抽，大火烧开后撇去泡沫，转中火加盖炖 40 分钟。', time: 45 },
      { content: '开盖大火收汁至浓稠，加盐调味，撒葱段出锅。', time: 6 },
    ],
    nutritionAnalysis: '鸭肉比鸡肉脂肪更少，富含 B 族维生素，啤酒炖制后麦香浓郁。'
  },

  // ==================== 清蒸（5 道）====================
  {
    id: 11,
    title: '清蒸鲈鱼',
    quote: '「蒸」是最大程度保留食材原味与营养的烹饪方式，鲈鱼刺少肉嫩，是清蒸最佳选材',
    rating: 4.9, count: 3100, emoji: '🐟',
    difficulty: '中等', time: 25, tags: ['清蒸', '鱼类', '家常'],
    ingredients: [
      { name: '鲈鱼', amount: '1条（约 600g）' }, { name: '生抽', amount: '3勺' },
      { name: '蒸鱼豉油', amount: '2勺' }, { name: '葱', amount: '3根' },
      { name: '生姜', amount: '5片' }, { name: '食用油', amount: '2勺' },
    ],
    steps: [
      { content: '鲈鱼处理干净，在鱼身两侧各划 3 刀（深至骨），用盐、料酒腌制 5 分钟；葱切长段，姜切薄片，一半放鱼肚里，一半铺盘底。', time: 8, tip: '划刀深一点，蒸时更均匀入味' },
      { content: '蒸锅水大火烧开，放入鱼，大火蒸 8 分钟（600g 以内），关火后不开盖虚蒸 2 分钟。', time: 11, tip: '宁可少蒸，别蒸过头——鱼肉变柴就惨了' },
      { content: '取出鱼，倒掉盘里多余的水，铺上葱丝姜丝，均匀淋上蒸鱼豉油。', time: 2 },
      { content: '另起小锅，2 勺食用油烧到微微冒烟，均匀泼在葱丝上，激出香气，立即端上桌。', time: 2, tip: '热油泼在葱丝上是「爆香」的关键，不可省略' },
    ],
    nutritionAnalysis: '鲈鱼每 100g 蛋白质约 19g，脂肪仅 3g，清蒸无额外油脂，是最健康的家宴菜。'
  },
  {
    id: 12,
    title: '粉蒸排骨',
    quote: '粉蒸的「蒸肉粉」由大米和多种香料磨制而成，裹在肉上蒸后变成酥糯外衣，独具川式风味',
    rating: 4.7, count: 1300, emoji: '🍖',
    difficulty: '中等', time: 40, tags: ['清蒸', '排骨', '川味'],
    ingredients: [
      { name: '猪排骨', amount: '500g' }, { name: '蒸肉粉', amount: '1包（约 80g）' },
      { name: '豆瓣酱', amount: '1勺' }, { name: '生抽', amount: '2勺' },
      { name: '甜面酱', amount: '1勺' }, { name: '姜末', amount: '1勺' },
    ],
    steps: [
      { content: '排骨剁 3cm 段，洗净沥干，加豆瓣酱、生抽、甜面酱、姜末拌匀，腌制 20 分钟。', time: 22, tip: '腌制时间充足才够入味' },
      { content: '将蒸肉粉均匀裹在排骨上，让每块都沾满粉。', time: 3, tip: '裹粉时稍微用力压一压，不容易脱落' },
      { content: '排骨摆入蒸盘，蒸锅大火上气后放入，蒸 30 分钟至排骨熟透软烂。', time: 32, tip: '水要加足，中途不要掀盖' },
      { content: '出锅撒葱花，可配一碗白米饭或蒸南瓜。', time: 1 },
    ],
    nutritionAnalysis: '蒸制几乎不用额外加油，比红烧更清爽，米粉裹住排骨的汁水，口感软糯。'
  },
  {
    id: 13,
    title: '虾仁蒸蛋',
    quote: '蒸蛋要加温水（约 80°C），而非冷水——冷水会让蛋白质凝固不均匀，出现气孔',
    rating: 4.7, count: 1100, emoji: '🥚',
    difficulty: '简单', time: 20, tags: ['清蒸', '蛋类', '家常'],
    ingredients: [
      { name: '鸡蛋', amount: '3个' }, { name: '虾仁', amount: '80g' },
      { name: '温水', amount: '240ml' }, { name: '蒸鱼豉油', amount: '1勺' },
      { name: '香油', amount: '几滴' },
    ],
    steps: [
      { content: '鸡蛋打散，按蛋液 1:1.5 比例加温水（约 80°C），加少许盐，搅匀后过筛去除气泡。', time: 3, tip: '过筛这一步决定蛋羹是否光滑如镜' },
      { content: '蒸碗盖上保鲜膜，用牙签扎 5~6 个小孔；虾仁提前用盐和料酒腌制 5 分钟。', time: 6 },
      { content: '蒸锅大火上气后转中小火，放入蒸碗蒸 10 分钟；2 分钟前将虾仁铺在蛋液表面。', time: 11, tip: '全程中小火，大火会让蛋羹起蜂窝' },
      { content: '出锅后淋蒸鱼豉油和少量香油，撒葱花即可。', time: 1 },
    ],
    nutritionAnalysis: '每份约含 15g 优质蛋白，脂肪极低，蒸制方式无额外油脂，是病号饭、婴儿辅食的绝佳选择。'
  },
  {
    id: 14,
    title: '剁椒鱼头',
    quote: '剁椒鱼头是湖南名菜，「左边红火右边白嫩」的双色造型据说是毛泽东的最爱',
    rating: 4.8, count: 2200, emoji: '🌶️',
    difficulty: '中等', time: 30, tags: ['清蒸', '湘菜', '鱼头'],
    ingredients: [
      { name: '鱼头', amount: '1个（花鲢或大头鱼）' }, { name: '剁椒', amount: '3勺' },
      { name: '蒸鱼豉油', amount: '2勺' }, { name: '姜末', amount: '1勺' },
      { name: '蒜末', amount: '1勺' }, { name: '葱', amount: '3根' },
    ],
    steps: [
      { content: '鱼头从中间劈开，保持底部相连，两面用盐和料酒涂抹，腌制 10 分钟；葱切段铺盘底。', time: 12 },
      { content: '将剁椒、姜末、蒜末混合，均匀铺在鱼头两面（特别是切面上）。', time: 3, tip: '剁椒铺厚一点，才够味' },
      { content: '蒸锅大火上气，放入鱼头大火蒸 12 分钟，关火虚蒸 2 分钟。', time: 15, tip: '时间不要超，鱼肉一过火就老' },
      { content: '取出，淋蒸鱼豉油，铺葱丝，热油泼香，即可上桌。', time: 2, tip: '热油要够热，泼上去滋滋作响才算对' },
    ],
    nutritionAnalysis: '鱼头富含胶原蛋白和 DHA，辣椒素促进新陈代谢，是一道兼顾颜值与营养的名菜。'
  },
  {
    id: 15,
    title: '荷叶糯米鸡',
    quote: '荷叶本身含多种黄酮类物质，蒸制时香气渗入糯米，解腻提香，是传统养生食材',
    rating: 4.6, count: 980, emoji: '🍃',
    difficulty: '复杂', time: 60, tags: ['清蒸', '粤菜', '糯米'],
    ingredients: [
      { name: '糯米', amount: '200g（提前泡 4 小时）' }, { name: '鸡腿肉', amount: '200g' },
      { name: '香菇', amount: '4朵（泡发）' }, { name: '干荷叶', amount: '2张' },
      { name: '生抽', amount: '2勺' }, { name: '蚝油', amount: '1勺' },
    ],
    steps: [
      { content: '糯米泡 4 小时后沥干；鸡腿肉切丁，香菇切丁，加生抽、蚝油、生粉腌制 15 分钟。', time: 20, tip: '糯米必须充分泡发，否则蒸不透' },
      { content: '热锅下油，炒香鸡肉和香菇，炒至八成熟后加入糯米翻炒均匀。', time: 6, tip: '糯米先炒一下可以减少蒸制时间' },
      { content: '干荷叶用热水泡软，取适量糯米饭料放在荷叶上，包裹成长方形。', time: 8, tip: '包紧一点，蒸时不会散开' },
      { content: '蒸锅大火上气后放入，蒸 30 分钟至糯米全熟，开荷叶后香气扑鼻。', time: 32 },
    ],
    nutritionAnalysis: '糯米提供长效碳水，鸡肉补充蛋白，荷叶清香解腻，是正宗点心的家庭版做法。'
  },

  // ==================== 经典炒菜（12 道）====================
  {
    id: 16,
    title: '番茄炒蛋',
    quote: '番茄炒蛋是中国最国民的家常菜，据估算全国每天约有 2 亿人同时在吃这道菜',
    rating: 4.9, count: 9800, emoji: '🍳',
    difficulty: '简单', time: 12, tags: ['炒菜', '快手', '家常'],
    ingredients: [
      { name: '鸡蛋', amount: '3个' }, { name: '西红柿', amount: '2个（约 300g）' },
      { name: '葱', amount: '1根' }, { name: '白糖', amount: '1小勺（可选）' },
    ],
    steps: [
      { content: '鸡蛋打散加少许盐搅匀；西红柿切大块，葱切葱花；锅烧热加油，油温七成热时下蛋液，快速翻炒成大块蛋花后盛出。', time: 4, tip: '鸡蛋要炒成嫩滑大块，别炒散了' },
      { content: '原锅留少量油，下葱花爆香，放番茄块，中大火翻炒出汁，加少许糖提鲜（可选）。', time: 4, tip: '番茄要炒出汁，汤汁多了才好拌饭' },
      { content: '倒回鸡蛋，加盐调味，翻炒均匀出锅。整个过程大火快炒，时间不超过 3 分钟。', time: 2, tip: '最后加盐，防止番茄出水过多' },
    ],
    nutritionAnalysis: '鸡蛋提供完全蛋白质，番茄富含维生素 C 和番茄红素，经典营养互补的家常组合。'
  },
  {
    id: 17,
    title: '辣椒炒肉',
    quote: '辣椒炒肉是湘菜经典，相传是毛泽东最爱的下饭菜，用的辣椒要选「螺丝椒」才地道',
    rating: 4.9, count: 3200, emoji: '🌶️',
    difficulty: '简单', time: 20, tags: ['炒菜', '湘菜', '下饭'],
    ingredients: [
      { name: '五花肉', amount: '200g' }, { name: '青椒', amount: '3个（螺丝椒最佳）' },
      { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '半勺' }, { name: '豆豉', amount: '1勺' },
    ],
    steps: [
      { content: '五花肉切薄片（约 3mm），青椒切圈或斜段，大蒜拍扁备用。', time: 5, tip: '肉要切薄，才能在大火下快速逼出油脂' },
      { content: '冷锅不放油，放入五花肉片，中火慢煎将肉内油脂逼出，肉片变透明微卷时捞出备用。', time: 6, tip: '「煸」出猪油是辣椒炒肉香的精髓' },
      { content: '用锅中逼出的猪油，放大蒜、豆豉中火炒香，下青椒大火翻炒约 2 分钟至断生稍软。', time: 4, tip: '青椒稍微炒软才入味，不要全程大火炒脆' },
      { content: '放回五花肉，加生抽、老抽翻炒均匀，加盐调味，大火翻炒 30 秒出锅。', time: 2 },
    ],
    nutritionAnalysis: '辣椒含丰富维生素 C，五花肉提供脂肪和蛋白质，下饭神器，每餐必定吃超量。'
  },
  {
    id: 18,
    title: '宫保鸡丁',
    quote: '宫保鸡丁由清朝四川总督丁宝桢（官至太子少保，「宫保」是其官衔）命其厨师创制',
    rating: 4.9, count: 4100, emoji: '🥜',
    difficulty: '中等', time: 25, tags: ['炒菜', '川菜', '鸡肉'],
    ingredients: [
      { name: '鸡胸肉', amount: '300g' }, { name: '花生米', amount: '80g（炸熟）' },
      { name: '干辣椒', amount: '6个' }, { name: '花椒', amount: '1小勺' },
      { name: '大葱', amount: '1段' }, { name: '生抽', amount: '2勺' },
      { name: '白糖', amount: '1勺' }, { name: '白醋', amount: '1勺' },
    ],
    steps: [
      { content: '鸡胸肉切 1.5cm 丁，加生抽、料酒、生粉、少许盐腌制 10 分钟；调碗汁：生抽 2 勺、糖 1 勺、醋 1 勺、生粉半勺、水 2 勺搅匀备用。', time: 12, tip: '鸡丁提前腌制上浆，炒出来才嫩滑不柴' },
      { content: '锅烧热下油，放干辣椒和花椒，小火炒至颜色变深出香味（约 30 秒），注意别炒焦。', time: 2, tip: '辣椒花椒要小火，炒焦了就是苦味' },
      { content: '转大火，下鸡丁快速翻炒至变色，约 2 分钟。加大葱段翻炒 30 秒。', time: 3 },
      { content: '倒入碗汁，大火翻炒让汁水均匀裹住鸡丁，收汁后关火，拌入花生米即可。', time: 2, tip: '花生最后放，保持酥脆' },
    ],
    nutritionAnalysis: '鸡胸肉高蛋白低脂肪，花生提供不饱和脂肪酸，是蛋白质和健康脂肪的优秀来源。'
  },
  {
    id: 19,
    title: '鱼香肉丝',
    quote: '「鱼香」并无鱼，而是一种源于四川「泡鱼辣椒」的特殊调味法，其独特酸甜辣咸口是川菜符号',
    rating: 4.8, count: 3400, emoji: '🌶️',
    difficulty: '中等', time: 25, tags: ['炒菜', '川菜', '猪肉'],
    ingredients: [
      { name: '猪里脊', amount: '250g' }, { name: '黑木耳', amount: '20g（泡发）' },
      { name: '胡萝卜', amount: '半根' }, { name: '郫县豆瓣酱', amount: '1勺' },
      { name: '生抽', amount: '2勺' }, { name: '糖', amount: '1勺' },
      { name: '白醋', amount: '1勺' }, { name: '大蒜', amount: '3瓣' },
    ],
    steps: [
      { content: '里脊肉切 0.3cm 细丝，加料酒、生粉、少许盐腌制；胡萝卜、木耳均切丝；调鱼香汁：豆瓣酱、生抽、糖、醋、生粉、水混合备用。', time: 12, tip: '肉丝要逆纹切，纤维短才嫩' },
      { content: '热锅下油，大火滑炒肉丝至变色，盛出备用。', time: 3, tip: '肉丝炒过头会老，变色即可' },
      { content: '原锅加少量油，中火炒香姜蒜末，放豆瓣酱炒出红油，放胡萝卜、木耳翻炒 2 分钟。', time: 4, tip: '豆瓣酱一定要炒出红油才香' },
      { content: '放回肉丝，倒入调好的鱼香汁，大火翻炒均匀，出锅撒葱花。', time: 2 },
    ],
    nutritionAnalysis: '猪肉提供 B 族维生素，木耳补铁，胡萝卜含 β-胡萝卜素，营养搭配合理。'
  },
  {
    id: 20,
    title: '麻婆豆腐',
    quote: '麻婆豆腐出自清朝成都「陈麻婆豆腐店」，麻（花椒）、辣（豆瓣）、烫、嫩、鲜是其五大特点',
    rating: 4.9, count: 2200, emoji: '🧈',
    difficulty: '中等', time: 20, tags: ['炒菜', '川菜', '豆腐'],
    ingredients: [
      { name: '豆腐', amount: '1块（约 400g，嫩豆腐）' }, { name: '猪肉末', amount: '100g' },
      { name: '郫县豆瓣酱', amount: '1.5勺' }, { name: '花椒粉', amount: '1小勺' },
      { name: '生抽', amount: '1勺' }, { name: '大蒜', amount: '3瓣' },
      { name: '葱', amount: '2根' },
    ],
    steps: [
      { content: '豆腐切 2cm 方块，入盐水（加少许盐）浸泡 5 分钟，沥干备用——盐水去除豆腥味并让豆腐更结实。', time: 6, tip: '盐水浸泡是豆腐不易碎的小技巧' },
      { content: '热锅下油，中火炒香猪肉末至变色出香，加蒜末、豆瓣酱，小火炒出红油，约 1 分钟。', time: 4, tip: '豆瓣酱要炒出红油，这是麻婆豆腐的灵魂' },
      { content: '倒入约 200ml 高汤或清水，放生抽，大火烧开后轻轻放入豆腐，中火煮 4 分钟。', time: 6, tip: '放豆腐后不要大力翻炒，用勺子轻推，保持豆腐完整' },
      { content: '分两次勾薄芡，让汤汁裹在豆腐上；出锅前撒花椒粉、葱花即可。', time: 2, tip: '花椒粉最后放，香气最浓' },
    ],
    nutritionAnalysis: '豆腐是优质植物蛋白，猪肉末增加脂肪和鲜味，麻辣花椒促进血液循环。'
  },
  {
    id: 21,
    title: '回锅肉',
    quote: '「回锅」是指先煮后炒，肉块经过两次烹饪，外皮焦香、内里软糯，是无可取代的川菜经典',
    rating: 4.9, count: 2800, emoji: '🥩',
    difficulty: '中等', time: 35, tags: ['炒菜', '川菜', '猪肉'],
    ingredients: [
      { name: '五花肉', amount: '300g' }, { name: '青蒜苗', amount: '2根' },
      { name: '郫县豆瓣酱', amount: '1.5勺' }, { name: '甜面酱', amount: '1勺' },
      { name: '料酒', amount: '2勺' }, { name: '生抽', amount: '1勺' },
    ],
    steps: [
      { content: '五花肉整块冷水下锅，加葱段、姜、料酒，大火烧开后转中火煮 20 分钟至八分熟，捞出晾凉后切 3mm 薄片。', time: 25, tip: '肉煮到筷子插进去不出血水即可，不要全熟' },
      { content: '锅中不放油，下肉片，中火慢煎，逼出油脂，肉片卷起（呈「灯盏形」）后盛出。', time: 5, tip: '等肉片自然卷起，这是回锅肉最漂亮的状态' },
      { content: '利用锅中猪油，放豆瓣酱中火炒出红油，加甜面酱翻炒 30 秒。', time: 2, tip: '甜面酱增甜增鲜，不可省略' },
      { content: '放回肉片，加生抽翻炒均匀，放青蒜苗大火翻炒 1 分钟，出锅。', time: 2, tip: '青蒜苗要大火快炒，保留翠绿色' },
    ],
    nutritionAnalysis: '二次烹饪让多余脂肪析出，比直接炒肉少油。甜面酱带来独特酱香，是川菜中最下饭的菜式。'
  },
  {
    id: 22,
    title: '干煸四季豆',
    quote: '「干煸」是让食材在少油中不断翻炒，直到水分蒸发、皮微皱的烹饪技法，四季豆最适合',
    rating: 4.8, count: 2100, emoji: '🫛',
    difficulty: '简单', time: 20, tags: ['炒菜', '素食', '下饭'],
    ingredients: [
      { name: '四季豆', amount: '300g' }, { name: '猪肉末', amount: '50g（可选）' },
      { name: '干辣椒', amount: '3个' }, { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '2勺' }, { name: '豆豉', amount: '1勺' },
    ],
    steps: [
      { content: '四季豆去两端，折成约 5cm 段；猪肉末加料酒、少许酱油腌制；大蒜切末，干辣椒剪段备用。', time: 5 },
      { content: '锅中多放一些油（约 3 勺），大火将四季豆入锅翻炒，持续翻炒约 5 分钟至表皮起皱变软。', time: 6, tip: '要耐心翻炒，让四季豆失去水分才不会有「生豆味」' },
      { content: '推开四季豆，下猪肉末、干辣椒、豆豉炒香，约 1 分钟。', time: 2 },
      { content: '放蒜末，全部食材合炒，加生抽调味，大火翻炒 1 分钟出锅。', time: 2, tip: '蒜末最后放，香气最浓' },
    ],
    nutritionAnalysis: '四季豆富含膳食纤维和植物蛋白，干煸方式比爆炒用油少，是很好的配菜。'
  },
  {
    id: 23,
    title: '蒜蓉西兰花',
    quote: '西兰花是十字花科明星，富含萝卜硫素——这是目前已知最强的天然抗癌物质之一',
    rating: 4.6, count: 890, emoji: '🥦',
    difficulty: '简单', time: 12, tags: ['炒菜', '素食', '减脂'],
    ingredients: [
      { name: '西兰花', amount: '1颗（约 400g）' }, { name: '大蒜', amount: '5瓣' },
      { name: '食用油', amount: '2勺' }, { name: '生抽', amount: '1勺' },
      { name: '蚝油', amount: '1勺' },
    ],
    steps: [
      { content: '西兰花切小朵，入加了盐和几滴油的沸水中焯 1.5 分钟，捞出立刻过冷水，保持翠绿色。', time: 5, tip: '加油焯水可以让西兰花颜色更绿更亮' },
      { content: '大蒜切末；锅中 2 勺油烧热，中火爆香蒜末至微黄，约 30 秒。', time: 2, tip: '蒜末要炒到微黄才出香，别炒焦' },
      { content: '放入西兰花，大火翻炒 1 分钟，加生抽、蚝油调味，翻炒均匀出锅。', time: 2 },
    ],
    nutritionAnalysis: '每 100g 西兰花约 34 大卡，膳食纤维 2.6g，维生素 C 达 51mg，减脂期首选蔬菜。'
  },
  {
    id: 24,
    title: '地三鲜',
    quote: '地三鲜是东北菜代表，「地」指土地，三鲜指茄子、土豆、青椒，三样本地蔬菜的完美组合',
    rating: 4.8, count: 1800, emoji: '🍆',
    difficulty: '中等', time: 25, tags: ['炒菜', '东北菜', '素食'],
    ingredients: [
      { name: '茄子', amount: '1个（约 200g）' }, { name: '土豆', amount: '1个' },
      { name: '青椒', amount: '1个' }, { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '2勺' }, { name: '老抽', amount: '半勺' },
    ],
    steps: [
      { content: '茄子切滚刀块，用盐抓拌腌制 5 分钟后挤去多余水分；土豆切厚片；青椒切块。', time: 8, tip: '盐腌茄子可减少吸油量，是素食但不油腻的关键' },
      { content: '锅中较多油，先下土豆片，中火煎至两面金黄（约 5 分钟），捞出备用。', time: 6 },
      { content: '同锅下茄子，中大火煎炒至软塌、微金黄，约 3 分钟，捞出备用。', time: 4 },
      { content: '另起锅少量油，爆香蒜末，放入青椒炒 1 分钟，放回茄子土豆，加生抽老抽翻炒均匀，出锅。', time: 3, tip: '青椒最后放保留口感，别炒烂了' },
    ],
    nutritionAnalysis: '茄子中的花青素有抗氧化功效，土豆提供碳水，三素合炒是颜色最漂亮的素菜之一。'
  },
  {
    id: 25,
    title: '酸辣土豆丝',
    quote: '土豆约 8000 年前在南美安第斯山脉被驯化，如今是全球第四大粮食作物，也是最百搭的食材',
    rating: 4.7, count: 2500, emoji: '🥔',
    difficulty: '简单', time: 15, tags: ['炒菜', '快手', '素食'],
    ingredients: [
      { name: '土豆', amount: '2个（约 400g）' }, { name: '干辣椒', amount: '3个' },
      { name: '白醋', amount: '2勺' }, { name: '葱', amount: '2根' },
      { name: '大蒜', amount: '2瓣' },
    ],
    steps: [
      { content: '土豆去皮切 0.2cm 细丝，立刻泡入清水（加少许醋）中，泡约 5 分钟去除多余淀粉，沥干备用。', time: 6, tip: '泡水是土豆丝脆爽的关键，去掉淀粉才不黏糊' },
      { content: '锅中油烧至七成热，放干辣椒段炒香，约 30 秒。', time: 1, tip: '辣椒要炒出香味，不要炒焦' },
      { content: '下土豆丝，大火翻炒约 2 分钟，沿锅边淋入白醋，加盐、蒜末翻炒均匀。', time: 3, tip: '沿锅边淋醋，醋在高温下激发香气，比直接淋更香' },
      { content: '撒葱花，再翻炒 30 秒出锅。土豆丝要保留一点脆感，别炒过头。', time: 1 },
    ],
    nutritionAnalysis: '土豆含优质碳水和钾元素，热量比米饭低，是减脂控体重的友好选择。'
  },
  {
    id: 26,
    title: '木耳炒鸡蛋',
    quote: '黑木耳有「素中之肉」之称，含铁量是猪肝的 7 倍，与鸡蛋搭配是天然补铁补蛋白质的最佳组合',
    rating: 4.6, count: 1200, emoji: '🖤',
    difficulty: '简单', time: 12, tags: ['炒菜', '快手', '家常'],
    ingredients: [
      { name: '黑木耳', amount: '20g（干，泡发后约 200g）' }, { name: '鸡蛋', amount: '3个' },
      { name: '葱', amount: '2根' }, { name: '生抽', amount: '1勺' },
    ],
    steps: [
      { content: '干木耳提前泡发 30 分钟，洗净撕成小朵；鸡蛋打散加少许盐。', time: 5 },
      { content: '热锅下油，油热后倒蛋液，大火翻炒成嫩蛋花，盛出备用。', time: 2, tip: '蛋花要嫩，别炒老了' },
      { content: '原锅下葱花爆香，放木耳大火翻炒 2 分钟，加生抽。', time: 3 },
      { content: '放回鸡蛋，翻炒均匀，加盐调味出锅。', time: 1 },
    ],
    nutritionAnalysis: '木耳铁含量极高，鸡蛋提供完整氨基酸，两者搭配营养互补，补血效果显著。'
  },
  {
    id: 27,
    title: '青椒肉丝',
    quote: '青椒的辣椒素含量远低于辣椒，但维生素 C 含量是同重量番茄的 3 倍，与猪肉互补营养',
    rating: 4.7, count: 2200, emoji: '🫑',
    difficulty: '简单', time: 18, tags: ['炒菜', '快手', '家常'],
    ingredients: [
      { name: '猪里脊', amount: '200g' }, { name: '青椒', amount: '3个' },
      { name: '大蒜', amount: '2瓣' }, { name: '生抽', amount: '2勺' },
      { name: '生粉', amount: '1勺' },
    ],
    steps: [
      { content: '里脊切细丝，加生抽、生粉、料酒腌制 10 分钟；青椒去籽切丝，蒜切末。', time: 12, tip: '肉丝腌制上浆是嫩滑的关键' },
      { content: '热锅下较多油（约 3 勺），油热后下肉丝，大火快速滑炒至变色，盛出备用。', time: 3, tip: '油要多一点，高温短时炒制肉才嫩' },
      { content: '留底油，下蒜末爆香，放青椒丝大火翻炒 1.5 分钟，放回肉丝。', time: 2 },
      { content: '加盐调味，大火翻炒 30 秒均匀，出锅。', time: 1 },
    ],
    nutritionAnalysis: '里脊肉脂肪少，青椒维生素 C 丰富，高温快炒有效保留营养素。'
  },

  // ==================== 汤类（8 道）====================
  {
    id: 28,
    title: '番茄鸡蛋汤',
    quote: '番茄蛋花汤是最快速的暖胃汤，10 分钟内出锅，任何厨房新手都能成功',
    rating: 4.7, count: 4200, emoji: '🍅',
    difficulty: '简单', time: 12, tags: ['汤类', '快手', '家常'],
    ingredients: [
      { name: '番茄', amount: '2个' }, { name: '鸡蛋', amount: '2个' },
      { name: '葱花', amount: '适量' }, { name: '香油', amount: '几滴' },
    ],
    steps: [
      { content: '番茄切大块；鸡蛋打散备用；锅中加水约 600ml，大火煮沸。', time: 5 },
      { content: '下番茄块，转中火煮 3 分钟，用勺子边搅动边慢慢倒入蛋液，形成蛋花。', time: 4, tip: '边搅动边倒蛋液，蛋花更细腻均匀' },
      { content: '加盐调味，滴几滴香油，撒葱花出锅。', time: 1 },
    ],
    nutritionAnalysis: '番茄红素是强效抗氧化剂，鸡蛋提供完全蛋白，这道汤热量低、消化快，老少皆宜。'
  },
  {
    id: 29,
    title: '冬瓜排骨汤',
    quote: '冬瓜含水量高达 96%，热量极低，具有清热利水的功效，是夏天最适合的排毒汤',
    rating: 4.6, count: 1100, emoji: '🍵',
    difficulty: '简单', time: 60, tags: ['汤类', '家常', '排骨'],
    ingredients: [
      { name: '猪排骨', amount: '400g' }, { name: '冬瓜', amount: '500g' },
      { name: '生姜', amount: '4片' }, { name: '葱', amount: '2根' },
    ],
    steps: [
      { content: '排骨冷水下锅，加姜片，大火煮沸焯水 3 分钟，捞出洗净；冬瓜去皮切厚片。', time: 8 },
      { content: '砂锅中加足量清水（约 1.5L），放排骨和姜片，大火烧开后转小火炖 40 分钟。', time: 44 },
      { content: '放入冬瓜片，继续炖 15 分钟至冬瓜软透，加盐调味，撒葱花出锅。', time: 16, tip: '冬瓜不要炖太久，软而不烂口感最好' },
    ],
    nutritionAnalysis: '冬瓜几乎零热量，排骨补充蛋白质和钙，炖汤后营养溶于汤中，非常易吸收。'
  },
  {
    id: 30,
    title: '玉米排骨汤',
    quote: '玉米中的谷氨酸是天然增鲜剂，与排骨同炖，无需任何味精鸡精，汤汁自然鲜甜',
    rating: 4.7, count: 1500, emoji: '🌽',
    difficulty: '简单', time: 65, tags: ['汤类', '家常', '排骨'],
    ingredients: [
      { name: '猪排骨', amount: '400g' }, { name: '玉米', amount: '1根' },
      { name: '胡萝卜', amount: '1根' }, { name: '生姜', amount: '4片' },
    ],
    steps: [
      { content: '排骨冷水焯水洗净；玉米切段；胡萝卜滚刀块。', time: 8 },
      { content: '所有食材放入锅，加足量清水（约 1.5L），大火烧开后撇净浮沫。', time: 5 },
      { content: '转小火加盖炖 50 分钟，加盐调味即可。', time: 52, tip: '时间越长汤越甜，不用放味精' },
    ],
    nutritionAnalysis: '玉米富含膳食纤维，排骨补钙补蛋白，胡萝卜含 β-胡萝卜素，是营养全面的家常靓汤。'
  },
  {
    id: 31,
    title: '紫菜蛋花汤',
    quote: '紫菜富含碘和牛磺酸，鸡蛋含卵磷脂，两者共煮是最简单快速的营养补充方案',
    rating: 4.5, count: 1800, emoji: '🍵',
    difficulty: '简单', time: 8, tags: ['汤类', '快手', '素食'],
    ingredients: [
      { name: '紫菜', amount: '10g（干）' }, { name: '鸡蛋', amount: '2个' },
      { name: '虾皮', amount: '5g' }, { name: '香油', amount: '几滴' },
    ],
    steps: [
      { content: '紫菜撕碎放碗；鸡蛋打散；锅中清水烧开。', time: 3 },
      { content: '水开后下虾皮，倒入蛋液边搅动边倒形成蛋花，煮沸。', time: 2, tip: '轻柔搅动，蛋花更漂亮' },
      { content: '冲入紫菜碗中，加盐、香油、葱花即可。', time: 1 },
    ],
    nutritionAnalysis: '全程不超过 8 分钟，每份含铁、碘、蛋白质，是最高效的营养汤品。'
  },
  {
    id: 32,
    title: '酸辣汤',
    quote: '酸辣汤起源于豫菜，「酸」靠醋、「辣」靠胡椒，是暖胃开胃的冬季必备，喝完全身发热',
    rating: 4.7, count: 2300, emoji: '🌶️',
    difficulty: '中等', time: 20, tags: ['汤类', '开胃', '家常'],
    ingredients: [
      { name: '豆腐', amount: '100g' }, { name: '木耳', amount: '10g（泡发）' },
      { name: '胡萝卜', amount: '半根' }, { name: '鸡蛋', amount: '1个' },
      { name: '白醋', amount: '3勺' }, { name: '白胡椒粉', amount: '1小勺' },
    ],
    steps: [
      { content: '豆腐、木耳、胡萝卜均切细丝；高汤（或清水+鸡精）倒入锅中烧开。', time: 6 },
      { content: '依次放入豆腐丝、木耳丝、胡萝卜丝，中火煮 3 分钟。', time: 4 },
      { content: '加白醋、白胡椒粉，调入生抽和盐。淀粉水勾薄芡，边搅边倒蛋液形成蛋花。', time: 4, tip: '先加醋胡椒再勾芡，酸辣味更鲜明' },
      { content: '出锅滴几滴香油，撒葱花、香菜。', time: 1 },
    ],
    nutritionAnalysis: '豆腐补钙，木耳补铁，醋中的有机酸开胃助消化，白胡椒促进血液循环。'
  },
  {
    id: 33,
    title: '皮蛋瘦肉粥',
    quote: '皮蛋（松花蛋）在制作过程中 pH 值升高，氨基酸结构改变，产生特殊风味，与瘦肉搭配是粤式早茶经典',
    rating: 4.8, count: 3200, emoji: '🥣',
    difficulty: '简单', time: 50, tags: ['汤类', '粥类', '早餐'],
    ingredients: [
      { name: '大米', amount: '100g' }, { name: '皮蛋', amount: '2个' },
      { name: '猪瘦肉', amount: '100g' }, { name: '生姜', amount: '5片' },
    ],
    steps: [
      { content: '米洗净，加少量盐和食用油腌制 15 分钟；瘦肉切片，加生抽、生粉腌制；皮蛋切丁。', time: 18 },
      { content: '锅中加水约 1L，大火烧开后放米，大火煮 5 分钟转中小火煮 20 分钟至粥浓稠。', time: 28, tip: '提前腌米，粥煮出来更绵滑' },
      { content: '加入腌好的瘦肉片，拨散开，煮 3 分钟至熟。', time: 4, tip: '肉片分散放，别一坨一坨的' },
      { content: '放入皮蛋丁，加盐调味，撒葱花姜丝出锅。', time: 1 },
    ],
    nutritionAnalysis: '粥易消化吸收，瘦肉补蛋白，皮蛋含矿物质，早餐暖胃养胃。'
  },
  {
    id: 34,
    title: '海带豆腐汤',
    quote: '海带含碘量是所有食物中最高的，与豆腐同煮，碘、钙、植物蛋白三合一，是自然的甲状腺保护餐',
    rating: 4.5, count: 980, emoji: '🌊',
    difficulty: '简单', time: 20, tags: ['汤类', '素食', '养生'],
    ingredients: [
      { name: '海带', amount: '150g（湿）' }, { name: '豆腐', amount: '200g' },
      { name: '生姜', amount: '3片' }, { name: '香油', amount: '几滴' },
    ],
    steps: [
      { content: '海带洗净切宽段；豆腐切块；锅中清水加姜片大火烧开。', time: 5 },
      { content: '放入海带煮 10 分钟，加豆腐继续煮 5 分钟。', time: 16 },
      { content: '加盐调味，滴香油出锅。', time: 1 },
    ],
    nutritionAnalysis: '海带含丰富碘、钙、膳食纤维，豆腐补充植物蛋白，这道汤热量极低，非常健康。'
  },
  {
    id: 35,
    title: '小米粥',
    quote: '小米含有大量色氨酸，可以促进血清素合成，中医认为小米性温，有「养胃」功效',
    rating: 4.6, count: 1800, emoji: '🥣',
    difficulty: '简单', time: 40, tags: ['粥类', '早餐', '养胃'],
    ingredients: [
      { name: '小米', amount: '80g' }, { name: '清水', amount: '约 800ml' },
    ],
    steps: [
      { content: '小米淘洗干净，锅中加水（冷水比例约 1:10）大火烧开。', time: 8 },
      { content: '转中小火，持续小火慢熬 25~30 分钟，期间每隔 5 分钟搅动一次防止粘底。', time: 30, tip: '慢熬出来的粥米香浓郁，出现「粥油」最好' },
      { content: '粥呈浓稠状，表面有一层金黄粥油时即可出锅，可加少量冰糖。', time: 1, tip: '粥油是最营养的部分，千万别丢掉' },
    ],
    nutritionAnalysis: '小米含 B 族维生素、铁和色氨酸，膳食纤维含量是大米的 2 倍，消化慢、饱腹感强。'
  },

  // ==================== 面食 / 主食（8 道）====================
  {
    id: 36,
    title: '蛋炒饭',
    quote: '蛋炒饭的最高境界是「粒粒分明、金包银」，用隔夜饭最佳，因为米粒失水更干燥',
    rating: 4.8, count: 5200, emoji: '🍳',
    difficulty: '简单', time: 12, tags: ['主食', '快手', '炒饭'],
    ingredients: [
      { name: '隔夜米饭', amount: '2碗（约 350g）' }, { name: '鸡蛋', amount: '3个' },
      { name: '葱', amount: '2根' }, { name: '生抽', amount: '1勺' },
    ],
    steps: [
      { content: '鸡蛋打散加少许盐；葱切葱花；隔夜米饭用手捏散所有结块备用。', time: 3, tip: '米饭结块一定要捏散，否则炒不均匀' },
      { content: '热锅宽油（3~4 勺），油温七成热，倒入蛋液，快速翻炒成大块嫩蛋花，盛出。', time: 2, tip: '油要多，温度要高，这是蛋炒饭香的秘密' },
      { content: '原锅留油，倒入米饭，大火翻炒约 3 分钟，让每粒米饭都裹上油，听到「嗦嗦」声即佳。', time: 4, tip: '翻炒时要用锅铲背面压米饭，让结块散开' },
      { content: '放回鸡蛋，加生抽沿锅边淋入，放葱花，大火翻炒 1 分钟出锅。', time: 2, tip: '生抽沿锅边淋，增加锅气香味' },
    ],
    nutritionAnalysis: '米饭提供充足碳水，鸡蛋补充完整蛋白，高温炒制让食材香气全开，简单却让人满足。'
  },
  {
    id: 37,
    title: '虾仁炒饭',
    quote: '扬州炒饭中加入虾仁、海参、鸡腿肉、鸭肫等八种配料，家庭版精简为「虾仁」即能呈现九成风味',
    rating: 4.8, count: 2400, emoji: '🍤',
    difficulty: '简单', time: 18, tags: ['主食', '炒饭', '海鲜'],
    ingredients: [
      { name: '隔夜米饭', amount: '2碗' }, { name: '虾仁', amount: '100g' },
      { name: '鸡蛋', amount: '2个' }, { name: '胡萝卜', amount: '半根' },
      { name: '豌豆', amount: '50g' }, { name: '葱', amount: '2根' },
    ],
    steps: [
      { content: '虾仁用盐、料酒腌制；胡萝卜切小丁；米饭捏散；鸡蛋打散。', time: 6 },
      { content: '热锅下油，中火炒熟虾仁至变色变弯，盛出备用。', time: 2 },
      { content: '原锅加油，倒蛋液快炒成蛋花，下米饭大火翻炒 3 分钟，加胡萝卜丁和豌豆。', time: 5, tip: '大火是炒饭有锅气的关键' },
      { content: '放回虾仁，加盐和生抽调味，撒葱花翻炒出锅。', time: 2 },
    ],
    nutritionAnalysis: '虾仁蛋白质含量极高且脂肪少，配合米饭和蔬菜，营养非常全面均衡。'
  },
  {
    id: 38,
    title: '炸酱面',
    quote: '老北京炸酱面讲究「菜码」的丰富：黄瓜、豆芽、绿豆、心里美萝卜至少四样，面条才算完整',
    rating: 4.8, count: 2900, emoji: '🍜',
    difficulty: '中等', time: 30, tags: ['主食', '面条', '北京菜'],
    ingredients: [
      { name: '鲜面条', amount: '300g（宽面）' }, { name: '猪肉末', amount: '150g' },
      { name: '甜面酱', amount: '3勺' }, { name: '黄酱', amount: '2勺' },
      { name: '黄瓜', amount: '半根（切丝配菜）' }, { name: '豆芽', amount: '一把（焯熟配菜）' },
    ],
    steps: [
      { content: '甜面酱和黄酱按 3:2 比例混合，加少量水搅匀备用；猪肉末加料酒和生抽腌制 5 分钟。', time: 8 },
      { content: '锅中油烧热，放葱姜末炒香，下肉末大火翻炒至变色散开，约 3 分钟。', time: 4 },
      { content: '倒入调好的酱料，转小火慢慢翻炒，约 8 分钟至酱料浓稠、油香四溢；炒制过程中加少量温水防止粘锅。', time: 10, tip: '小火慢炒，让酱香充分释放，是炸酱好不好的关键' },
      { content: '另起锅煮面，捞出后过冷水沥干，浇上炸酱，配上黄瓜丝和豆芽菜码。', time: 8, tip: '过冷水的面条口感更 Q 弹' },
    ],
    nutritionAnalysis: '甜面酱含 B 族维生素，猪肉末提供蛋白质，黄瓜配菜爽口解腻。'
  },
  {
    id: 39,
    title: '阳春面',
    quote: '阳春面因上海沪语将 10（钱）念作「阳春」而得名，是价格最低廉却要求功底最深的面食之一',
    rating: 4.5, count: 1200, emoji: '🍜',
    difficulty: '简单', time: 15, tags: ['主食', '面条', '快手'],
    ingredients: [
      { name: '细面条', amount: '150g' }, { name: '生抽', amount: '2勺' },
      { name: '猪油', amount: '1勺（或香油）' }, { name: '葱', amount: '3根' },
    ],
    steps: [
      { content: '葱切葱花；碗底放生抽、猪油、少许白糖、白胡椒粉备用。', time: 3, tip: '猪油是阳春面鲜香的灵魂，不可替代' },
      { content: '锅中水烧开，下面条，煮约 3~4 分钟至熟，捞出沥干。', time: 5, tip: '面要煮到有弹劲，别煮烂' },
      { content: '用热的面汤冲入碗底，搅匀，将面条放入，撒葱花。', time: 2, tip: '先兑汤再放面，让调料充分溶解' },
    ],
    nutritionAnalysis: '简单的面条汤，低热量易消化，早餐或宵夜都合适，关键在「汤底」的功夫。'
  },
  {
    id: 40,
    title: '葱油拌面',
    quote: '上海葱油拌面的精髓是将葱慢炸至深棕金黄，榨出葱香融入油中，这个「葱油」即是灵魂',
    rating: 4.8, count: 3100, emoji: '🍜',
    difficulty: '简单', time: 20, tags: ['主食', '面条', '快手'],
    ingredients: [
      { name: '细面条', amount: '200g' }, { name: '葱', amount: '5根' },
      { name: '食用油', amount: '50ml' }, { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '半勺' }, { name: '白糖', amount: '1小勺' },
    ],
    steps: [
      { content: '葱切成 3cm 长段（葱白和葱绿分开）；调碗汁：生抽、老抽、白糖、少许盐混合。', time: 5 },
      { content: '冷油下锅，放入葱白段，小火慢炸，约 8~10 分钟至葱变金黄（不要焦），捞出葱渣留葱油。', time: 12, tip: '全程小火，葱要炸到金黄才香，焦了就苦了' },
      { content: '趁热将葱油倒入调碗汁中，搅匀；另起锅煮熟面条，捞出沥干。', time: 3 },
      { content: '将拌汁浇在面条上，快速拌匀，放上炸好的葱花。', time: 1, tip: '趁热拌，让葱油充分裹住每根面条' },
    ],
    nutritionAnalysis: '面条提供碳水，葱油含挥发油和硫化物，有抗菌开胃功效，简单却令人上瘾。'
  },
  {
    id: 41,
    title: '猪肉白菜水饺',
    quote: '中国北方有「好吃不过饺子」的说法，逢年过节、迎来送往，饺子永远是最高规格的待客主食',
    rating: 4.9, count: 4500, emoji: '🥟',
    difficulty: '复杂', time: 90, tags: ['主食', '饺子', '北方菜'],
    ingredients: [
      { name: '面粉', amount: '300g' }, { name: '猪肉末', amount: '300g' },
      { name: '白菜', amount: '400g' }, { name: '葱', amount: '3根' },
      { name: '生抽', amount: '3勺' }, { name: '香油', amount: '1勺' },
      { name: '姜末', amount: '1勺' },
    ],
    steps: [
      { content: '面粉加温水（约 160ml），揉成光滑面团，盖湿布醒 30 分钟；白菜切末，加盐杀出水分，用力挤干。', time: 35, tip: '白菜水分必须挤干，否则馅太稀，包不住' },
      { content: '猪肉末加葱末、姜末、生抽、老抽、香油顺时针搅打上劲，拌入白菜末搅匀。', time: 8, tip: '顺时针搅打让肉馅有劲道，更 Q 弹' },
      { content: '面团搓条，揪成大小均匀的剂子，擀成中间厚边缘薄的圆皮，每个约 8~9cm。', time: 20, tip: '皮子中间厚是包饺子不破的关键' },
      { content: '包入适量馅料，捏紧（月牙形褶皱），大锅沸水下饺子，煮至浮起后再煮 3 分钟，点两次凉水后捞出。', time: 15, tip: '点凉水是让饺子皮筋道的老方法' },
    ],
    nutritionAnalysis: '饺子是面粉和蔬菜肉类的完美组合，碳水、蛋白质、纤维俱全，一顿饺子就是完整的一餐。'
  },
  {
    id: 42,
    title: '牛肉面',
    quote: '兰州牛肉面以「一清（汤）二白（萝卜）三红（辣子）四绿（香菜蒜苗）五黄（面条）」为标准',
    rating: 4.8, count: 3200, emoji: '🍜',
    difficulty: '中等', time: 50, tags: ['主食', '面条', '牛肉'],
    ingredients: [
      { name: '拉面或宽面', amount: '200g' }, { name: '牛腱', amount: '300g' },
      { name: '白萝卜', amount: '半根' }, { name: '八角', amount: '2个' },
      { name: '生抽', amount: '3勺' }, { name: '老抽', amount: '1勺' },
    ],
    steps: [
      { content: '牛腱切块，冷水焯水去血沫；白萝卜切厚片。', time: 8 },
      { content: '锅中加清水约 1.5L，放牛腱、八角、姜片，大火烧开转小火炖 30 分钟，加萝卜继续炖 20 分钟。', time: 52, tip: '时间要足，牛腱才软糯入味' },
      { content: '加生抽、老抽、盐调味，制成牛肉汤底。另煮面条，放入碗中。', time: 5 },
      { content: '浇上热汤，放几片牛肉和萝卜，放辣椒油和葱花香菜。', time: 2, tip: '汤底好不好，决定了面的灵魂' },
    ],
    nutritionAnalysis: '牛肉富含铁和蛋白质，萝卜含消化酶，面条提供碳水，一碗面是完整的一餐。'
  },
  {
    id: 43,
    title: '荷包蛋挂面',
    quote: '挂面加荷包蛋是中国最普遍的「治愈系」快手早餐，任何时候吃了都会觉得被好好照顾了',
    rating: 4.5, count: 2800, emoji: '🍜',
    difficulty: '简单', time: 12, tags: ['主食', '面条', '早餐'],
    ingredients: [
      { name: '挂面', amount: '100g' }, { name: '鸡蛋', amount: '2个' },
      { name: '葱', amount: '1根' }, { name: '生抽', amount: '1勺' },
      { name: '香油', amount: '几滴' },
    ],
    steps: [
      { content: '锅中水烧开，轻轻打入鸡蛋，中小火维持微沸状态煮 3 分钟，至蛋白凝固蛋黄还流心，捞出。', time: 5, tip: '水不要大滚，轻轻沸才能保持鸡蛋形状完整' },
      { content: '原锅水继续加热，下挂面，煮约 4~5 分钟至熟，捞入碗中。', time: 6 },
      { content: '放上荷包蛋，淋生抽和香油，撒葱花，舀一勺面汤进碗。', time: 1 },
    ],
    nutritionAnalysis: '挂面提供碳水，鸡蛋补蛋白，清淡易消化，胃不舒服的时候首选。'
  },

  // ==================== 海鲜（6 道）====================
  {
    id: 44,
    title: '白灼虾',
    quote: '粤菜「白灼」技法精髓是用沸腾的调味水快速烫熟食材，保留原味，讲究「火候」二字',
    rating: 4.7, count: 1900, emoji: '🦐',
    difficulty: '简单', time: 15, tags: ['清蒸', '海鲜', '粤菜'],
    ingredients: [
      { name: '鲜虾', amount: '500g（活虾最佳）' }, { name: '葱', amount: '2根' },
      { name: '生姜', amount: '3片' }, { name: '蒸鱼豉油', amount: '3勺' },
    ],
    steps: [
      { content: '虾洗净，用牙签从第三节虾背挑出虾线；葱切段，姜切片备用。', time: 5, tip: '虾线要挑干净，否则口感发苦' },
      { content: '锅中加清水，放葱段、姜片，大火煮沸，加少许料酒和盐。', time: 4 },
      { content: '放入虾，大火煮约 2 分钟，虾体弯曲变红即立刻捞出，不可过熟。', time: 3, tip: '宁可少一点，虾肉过火就老了——弯曲变红即可出锅' },
      { content: '趁热配蒸鱼豉油（兑少量香油和姜末）蘸食。', time: 1 },
    ],
    nutritionAnalysis: '虾蛋白质含量约 20%，脂肪仅 1%，是最优质的低脂高蛋白海鲜，白灼无额外油脂。'
  },
  {
    id: 45,
    title: '蒜蓉粉丝蒸扇贝',
    quote: '扇贝中富含牛磺酸，具有护肝、提高免疫力的功效，蒸制最大程度保留营养，是「中华料理」代表作',
    rating: 4.8, count: 1600, emoji: '🐚',
    difficulty: '中等', time: 20, tags: ['清蒸', '海鲜', '粤菜'],
    ingredients: [
      { name: '扇贝', amount: '6个（带壳）' }, { name: '粉丝', amount: '1把（泡软）' },
      { name: '大蒜', amount: '8瓣' }, { name: '蒸鱼豉油', amount: '3勺' },
      { name: '葱', amount: '2根' },
    ],
    steps: [
      { content: '扇贝撬开，保留一面壳，洗净里面的沙肠；粉丝泡软；大蒜切细末，煎锅少量油将蒜末小火炸至金黄，留蒜油备用。', time: 10, tip: '蒜末要炸到金黄，香气才能充分释放' },
      { content: '粉丝铺在扇贝上，在每个扇贝上放一勺炸香的蒜末。', time: 3 },
      { content: '蒸锅上气后，大火蒸 5 分钟即可。', time: 6, tip: '扇贝蒸的时间不能太长，不然肉会缩很小' },
      { content: '出锅后淋蒸鱼豉油、撒葱花，热油泼香。', time: 1 },
    ],
    nutritionAnalysis: '扇贝每 100g 蛋白质约 11g，脂肪不足 1g，粉丝口感 Q 弹，是高颜值的宴客菜。'
  },
  {
    id: 46,
    title: '油焖大虾',
    quote: '山东菜「油焖大虾」讲究用海虾，红亮入味，壳都带着鲜香，真正的吃虾人连壳一起嚼',
    rating: 4.8, count: 2100, emoji: '🦐',
    difficulty: '中等', time: 25, tags: ['炒菜', '海鲜', '山东菜'],
    ingredients: [
      { name: '大虾', amount: '500g（对虾或基围虾）' }, { name: '生抽', amount: '3勺' },
      { name: '糖', amount: '1勺' }, { name: '番茄酱', amount: '1勺' },
      { name: '大蒜', amount: '4瓣' }, { name: '生姜', amount: '3片' },
    ],
    steps: [
      { content: '虾去须剪掉虾枪，用牙签挑出虾线，用盐和料酒腌制 5 分钟。', time: 8, tip: '剪掉虾枪方便煎制时受热均匀' },
      { content: '热锅宽油，大火将虾两面煎至变红弯曲，约各 1 分钟，虾壳会变得酥脆，盛出备用。', time: 4 },
      { content: '留底油，放姜蒜爆香，加番茄酱炒出红色，放生抽、糖和少量水。', time: 3 },
      { content: '放回虾，中火翻炒 3 分钟让虾充分入味，大火收汁，出锅。', time: 4, tip: '汁要收得浓稠，每只虾都亮晶晶的最好看' },
    ],
    nutritionAnalysis: '对虾富含蛋白质、磷、硒，油焖方式入味彻底，是宴请最上台面的家常菜。'
  },
  {
    id: 47,
    title: '香煎三文鱼',
    quote: '三文鱼的橙红色来自虾青素，这是目前发现的最强天然抗氧化剂，人体无法自行合成',
    rating: 4.8, count: 650, emoji: '🐟',
    difficulty: '简单', time: 18, tags: ['煎炒', '海鲜', '西式'],
    ingredients: [
      { name: '三文鱼排', amount: '200g（厚约 3cm）' }, { name: '黑胡椒', amount: '适量' },
      { name: '柠檬', amount: '半个' }, { name: '迷迭香', amount: '少许' },
      { name: '黄油', amount: '1小块（可选）' },
    ],
    steps: [
      { content: '三文鱼排用厨房纸吸干水分，两面均匀撒盐和现磨黑胡椒，腌制 5 分钟。', time: 6, tip: '必须吸干水分，水分多会「蒸」不会「煎」' },
      { content: '平底锅大火预热至滴水成珠，加少量油，鱼皮朝下放入，不要移动，中大火煎 3 分钟至皮酥脆。', time: 4, tip: '皮朝下先煎，高温让皮变得香脆，是三文鱼最好吃的部分' },
      { content: '翻面，转中火再煎 2 分钟（三分熟）或 3 分钟（全熟），在锅边放一小块黄油融化淋上。', time: 3, tip: '三分熟内里嫩滑鲜甜，是最推荐的熟度' },
      { content: '出锅前挤上柠檬汁，放迷迭香点缀，立即上桌。', time: 1 },
    ],
    nutritionAnalysis: 'Omega-3 脂肪酸含量是所有鱼类中最高的，每周吃两次能显著降低心血管疾病风险。'
  },
  {
    id: 48,
    title: '蛤蜊蒸蛋',
    quote: '蛤蜊的谷氨酸含量是牛肉的 3 倍，是天然的「鲜味炸弹」，与蛋液同蒸，无需味精即鲜甜无比',
    rating: 4.7, count: 980, emoji: '🐚',
    difficulty: '简单', time: 20, tags: ['清蒸', '海鲜', '蛋类'],
    ingredients: [
      { name: '蛤蜊', amount: '300g（已吐沙）' }, { name: '鸡蛋', amount: '3个' },
      { name: '蒸鱼豉油', amount: '1勺' }, { name: '香油', amount: '几滴' },
    ],
    steps: [
      { content: '蛤蜊提前在盐水中吐沙 2 小时；鸡蛋打散加 1.5 倍温水（约 240ml），加少许盐，过筛备用。', time: 5, tip: '蛤蜊一定要吐沙干净，否则一口沙的感觉很差' },
      { content: '将蛤蜊均匀摆在蒸碗中，倒入蛋液，盖保鲜膜扎孔。', time: 2 },
      { content: '蒸锅上气后转中小火，蒸 10~12 分钟至蛋液凝固（可用筷子戳一下，无液体溢出即熟）。', time: 13, tip: '中小火蒸，避免大火让蛋液起泡泡' },
      { content: '出锅淋蒸鱼豉油和香油，点缀葱花。', time: 1 },
    ],
    nutritionAnalysis: '蛤蜊含丰富锌、硒、牛磺酸，鸡蛋提供完全蛋白，两者叠加鲜味极佳，营养密度高。'
  },
  {
    id: 49,
    title: '鱿鱼炒韭黄',
    quote: '韭黄是遮光生长的韭菜，叶绿素无法形成，保留大量糖分和特殊芳香物质，炒鱿鱼是绝配',
    rating: 4.6, count: 1200, emoji: '🦑',
    difficulty: '简单', time: 15, tags: ['炒菜', '海鲜', '快手'],
    ingredients: [
      { name: '鱿鱼', amount: '300g（处理好的）' }, { name: '韭黄', amount: '150g' },
      { name: '红辣椒', amount: '1个' }, { name: '生抽', amount: '2勺' },
      { name: '生粉', amount: '1勺' },
    ],
    steps: [
      { content: '鱿鱼切 0.5cm 宽花刀（内侧斜切），切段后用盐、料酒、生粉腌制；韭黄切段，红椒切丝。', time: 6, tip: '花刀切法让鱿鱼卷曲更好看，也更快熟' },
      { content: '锅中水烧开，鱿鱼入沸水焯 30 秒（卷曲成花状后立刻捞出），过冷水备用。', time: 3, tip: '焯水时间极短，鱿鱼过熟会变橡皮筋' },
      { content: '热锅下油，中大火下红椒爆香，放入韭黄大火翻炒 1 分钟。', time: 2 },
      { content: '放鱿鱼，加生抽，大火翻炒约 1 分钟，出锅。', time: 2, tip: '全程大火快炒，时间不超过 2 分钟' },
    ],
    nutritionAnalysis: '鱿鱼低脂高蛋白，韭黄含硫化物可杀菌，是热量极低但味道浓郁的家常菜。'
  },

  // ==================== 素食 / 凉菜（7 道）====================
  {
    id: 50,
    title: '凉拌黄瓜',
    quote: '黄瓜含水量高达 96%，热量约每 100g 仅 16 大卡，是所有蔬菜中热量最低的之一',
    rating: 4.5, count: 3200, emoji: '🥒',
    difficulty: '简单', time: 10, tags: ['凉菜', '素食', '快手'],
    ingredients: [
      { name: '黄瓜', amount: '2根' }, { name: '大蒜', amount: '4瓣' },
      { name: '白醋', amount: '2勺' }, { name: '生抽', amount: '1勺' },
      { name: '辣椒油', amount: '1勺（可选）' }, { name: '香油', amount: '1勺' },
    ],
    steps: [
      { content: '黄瓜用刀拍裂，切成约 3cm 小块，撒少许盐腌制 5 分钟，逼出多余水分后倒掉。', time: 6, tip: '「拍」出来的黄瓜更入味，比切片好' },
      { content: '大蒜捣成蒜泥；调拌汁：白醋、生抽、香油、辣椒油、少许白糖混合。', time: 2 },
      { content: '将黄瓜挤干水分，倒入拌汁和蒜泥，拌匀，腌制 5 分钟再吃。', time: 1, tip: '腌一会儿更入味，但不要超过 30 分钟，否则黄瓜出水太多' },
    ],
    nutritionAnalysis: '黄瓜几乎是热量为零的存在，大蒜素有强效杀菌功效，夏天必备的开胃凉菜。'
  },
  {
    id: 51,
    title: '凉拌木耳',
    quote: '木耳铁含量是猪肝的 7 倍，是素食者最重要的补铁食材，凉拌方式最大程度保留营养素',
    rating: 4.6, count: 1800, emoji: '🖤',
    difficulty: '简单', time: 12, tags: ['凉菜', '素食', '快手'],
    ingredients: [
      { name: '黑木耳', amount: '20g（干，泡发后约 200g）' }, { name: '香菜', amount: '适量' },
      { name: '大蒜', amount: '3瓣' }, { name: '白醋', amount: '2勺' },
      { name: '辣椒油', amount: '1勺' }, { name: '生抽', amount: '1勺' },
    ],
    steps: [
      { content: '木耳冷水泡发 30 分钟，撕成小朵，入沸水焯 2 分钟，捞出过冷水，沥干。', time: 6, tip: '焯水后过冷水，口感更脆爽' },
      { content: '大蒜捣泥；调拌汁：白醋、生抽、辣椒油、香油混合。', time: 2 },
      { content: '木耳放入碗中，倒入拌汁和蒜泥、香菜，翻拌均匀即可。', time: 1 },
    ],
    nutritionAnalysis: '每 100g 干木耳含铁高达 97mg，泡发后同样丰富，凉拌不加热能最好地保留铁元素。'
  },
  {
    id: 52,
    title: '皮蛋豆腐',
    quote: '皮蛋豆腐是粤式冷盘经典，全程不需要开火，三分钟即可上桌，却能让客人感觉被认真款待',
    rating: 4.7, count: 2400, emoji: '🥚',
    difficulty: '简单', time: 5, tags: ['凉菜', '快手', '下饭'],
    ingredients: [
      { name: '皮蛋', amount: '2个' }, { name: '嫩豆腐', amount: '1盒（约 350g）' },
      { name: '蒸鱼豉油', amount: '2勺' }, { name: '葱', amount: '1根' },
      { name: '香油', amount: '1勺' }, { name: '姜末', amount: '半勺' },
    ],
    steps: [
      { content: '嫩豆腐用刀直接在盒里切，翻扣在盘中；皮蛋剥壳，切成 4~6 瓣，摆在豆腐上。', time: 3, tip: '皮蛋用细线拉切，比刀切更整齐不粘' },
      { content: '调汁：蒸鱼豉油、香油、姜末、少许醋混合。', time: 1 },
      { content: '将调好的汁浇在豆腐和皮蛋上，撒葱花，即可上桌。', time: 1, tip: '要吃之前再浇汁，否则豆腐出水变水汪汪' },
    ],
    nutritionAnalysis: '豆腐含优质植物蛋白和钙，皮蛋富含矿物质，这道菜零烹饪热量低，是宴客的聪明选择。'
  },
  {
    id: 53,
    title: '鸡胸肉轻食沙拉',
    quote: '每 100g 鸡胸肉含约 31g 蛋白质，热量仅 165 大卡，是健身界公认的「增肌减脂最佳食材」',
    rating: 4.8, count: 1204, emoji: '🥗',
    difficulty: '简单', time: 15, tags: ['沙拉', '减脂', '高蛋白'],
    ingredients: [
      { name: '鸡胸肉', amount: '200g' }, { name: '生菜', amount: '100g' },
      { name: '番茄', amount: '1个' }, { name: '黄瓜', amount: '半根' },
      { name: '橄榄油', amount: '1勺' }, { name: '黑胡椒', amount: '适量' },
    ],
    steps: [
      { content: '鸡胸肉放入锅中，冷水下锅加姜片，大火烧开后转中小火煮 12 分钟；捞出晾凉后顺纹理用手撕成细丝。', time: 15, tip: '不要切，手撕的鸡肉丝纤维感更好，更容易入味' },
      { content: '生菜洗净撕块，番茄切片，黄瓜斜切薄片，放入大碗中。', time: 3 },
      { content: '放入鸡肉丝，淋橄榄油，撒黑胡椒和少量盐，轻轻拌匀装盘。', time: 1, tip: '蔬菜容易出水，吃之前再拌，别提前加盐' },
    ],
    nutritionAnalysis: '一份约含 35g 蛋白质，总热量不到 300 大卡，是减脂期最理想的主食兼蛋白质来源。'
  },
  {
    id: 54,
    title: '蒜泥白肉',
    quote: '川菜「蒜泥白肉」发源于乐山地区，是四川家庭酒席必备的冷盘，猪皮与肥肉的比例决定一切',
    rating: 4.7, count: 1600, emoji: '🥩',
    difficulty: '中等', time: 30, tags: ['凉菜', '川菜', '猪肉'],
    ingredients: [
      { name: '猪后腿肉（带皮）', amount: '400g' }, { name: '大蒜', amount: '6瓣' },
      { name: '辣椒油', amount: '2勺' }, { name: '生抽', amount: '2勺' },
      { name: '香油', amount: '1勺' }, { name: '白糖', amount: '半勺' },
    ],
    steps: [
      { content: '猪肉整块冷水下锅，加葱段、姜片、料酒，大火烧开后撇净浮沫，转中火煮 20~25 分钟至熟透（筷子插入无血水）。', time: 28, tip: '猪肉要整块煮，不要切了再煮，保持肉汁' },
      { content: '捞出后浸入冰水中 5 分钟（或放冷藏），让猪皮收紧、口感弹 Q。', time: 6, tip: '过冰水是蒜泥白肉皮脆肉嫩的关键步骤' },
      { content: '大蒜捣成细腻蒜泥，加辣椒油、生抽、香油、白糖调成酱汁。', time: 2 },
      { content: '猪肉切约 3mm 薄片，斜摆盘中，浇上蒜泥酱汁，撒葱花香菜。', time: 3, tip: '薄片是关键，可以用切肉机或者非常锋利的刀' },
    ],
    nutritionAnalysis: '猪皮富含胶原蛋白，肥瘦相间部分提供脂肪，是适合解馋的传统凉菜。'
  },
  {
    id: 55,
    title: '拍黄瓜',
    quote: '黄瓜经「拍」后细胞破壁，更容易吸附调料，且口感比切片更爽脆，是凉菜的基础功',
    rating: 4.6, count: 4500, emoji: '🥒',
    difficulty: '简单', time: 8, tags: ['凉菜', '快手', '素食'],
    ingredients: [
      { name: '黄瓜', amount: '2根' }, { name: '小米辣', amount: '2个（可选）' },
      { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '1勺' },
      { name: '香醋', amount: '1勺' }, { name: '香油', amount: '1勺' },
    ],
    steps: [
      { content: '用刀背或擀面杖拍黄瓜至裂开，用手掰成小块；小米辣切圈，大蒜剁末。', time: 3 },
      { content: '黄瓜块加盐抓匀腌 3 分钟，倒掉析出的水分。', time: 4, tip: '腌完挤水，黄瓜更脆不会水汪汪的' },
      { content: '加蒜末、辣椒圈、生抽、香醋、香油拌匀，立即上桌。', time: 1 },
    ],
    nutritionAnalysis: '黄瓜热量极低，脆爽解腻，大蒜素有杀菌功效，是夏日必备的零热量开胃凉菜。'
  },
  {
    id: 56,
    title: '夫妻肺片',
    quote: '「夫妻肺片」由民国时期成都小贩郭朝华与妻子张田正共同创制，因售价低廉而广受欢迎',
    rating: 4.7, count: 1400, emoji: '🌶️',
    difficulty: '中等', time: 90, tags: ['凉菜', '川菜', '卤味'],
    ingredients: [
      { name: '牛腱', amount: '300g' }, { name: '牛百叶', amount: '200g' },
      { name: '辣椒油', amount: '3勺' }, { name: '花椒油', amount: '1勺' },
      { name: '生抽', amount: '2勺' }, { name: '花生碎', amount: '适量' },
    ],
    steps: [
      { content: '牛腱冷水下锅，放香料（八角、桂皮、草果、姜），煮沸撇沫后转小火炖 60 分钟至软；牛百叶焯水后切丝。', time: 65 },
      { content: '牛腱晾凉切薄片；调拌汁：辣椒油、花椒油、生抽、香醋、糖混合。', time: 8 },
      { content: '牛腱片和百叶丝码盘，浇拌汁，撒花生碎、芝麻、葱花。', time: 3, tip: '花生碎要最后放，保持脆感' },
    ],
    nutritionAnalysis: '牛腱蛋白质高达 20%，百叶含胶原蛋白，麻辣风味开胃，但辣椒油热量较高。'
  },

  // ==================== 早餐（7 道）====================
  {
    id: 57,
    title: '牛油果吐司',
    quote: '牛油果被称为「超级食物」，其单不饱和脂肪酸（油酸）与橄榄油相近，是护心最佳选择',
    rating: 4.6, count: 980, emoji: '🥑',
    difficulty: '简单', time: 10, tags: ['早餐', '快手', '西式'],
    ingredients: [
      { name: '吐司', amount: '2片' }, { name: '牛油果', amount: '1个' },
      { name: '鸡蛋', amount: '1个' }, { name: '柠檬汁', amount: '少许' },
    ],
    steps: [
      { content: '吐司放入烤箱或烤面包机，180°C 烤 3 分钟至表面金黄酥脆。', time: 4, tip: '吐司烤过才有香气，直接吃口感差很多' },
      { content: '牛油果对半切，取出核，用勺挖出果肉，加少量柠檬汁和盐捣成粗泥。', time: 3, tip: '柠檬汁防止牛油果氧化变黑，也提升鲜味' },
      { content: '平底锅少量油，煎一个太阳蛋（蛋黄保持流心）；将牛油果泥抹在烤好的吐司上，放上太阳蛋，撒黑胡椒。', time: 4, tip: '太阳蛋流心，切开流下来配吐司最美' },
    ],
    nutritionAnalysis: '牛油果含优质脂肪和钾，鸡蛋补充完全蛋白，吐司提供碳水，是营养完整的早餐。'
  },
  {
    id: 58,
    title: '香蕉燕麦杯',
    quote: '燕麦的 β-葡聚糖是目前已知最有效的降胆固醇膳食纤维，每天 3g 即可产生明显效果',
    rating: 4.5, count: 870, emoji: '🥛',
    difficulty: '简单', time: 5, tags: ['早餐', '快手', '健康'],
    ingredients: [
      { name: '即食燕麦', amount: '80g' }, { name: '香蕉', amount: '1根' },
      { name: '牛奶', amount: '200ml' }, { name: '花生酱', amount: '1勺（可选）' },
    ],
    steps: [
      { content: '燕麦放入碗中，倒入热牛奶（约 80°C），浸泡 2 分钟至软；香蕉切片。', time: 3 },
      { content: '牛奶燕麦上放香蕉片，淋花生酱，可再加少量蜂蜜或蓝莓点缀。', time: 1 },
      { content: '趁热吃，如果喜欢凉食可提前一晚冷藏（「隔夜燕麦」），早起直接食用。', time: 1 },
    ],
    nutritionAnalysis: '燕麦升糖指数低（GI=55），搭配香蕉的钾和牛奶蛋白，提供 4 小时以上的持续能量。'
  },
  {
    id: 59,
    title: '法式吐司',
    quote: '法式吐司（French Toast）并非起源于法国，而是罗马时代就有记载的「穷人的奢侈早餐」',
    rating: 4.7, count: 1200, emoji: '🍞',
    difficulty: '简单', time: 15, tags: ['早餐', '西式', '鸡蛋'],
    ingredients: [
      { name: '厚吐司', amount: '2片' }, { name: '鸡蛋', amount: '2个' },
      { name: '牛奶', amount: '80ml' }, { name: '白糖', amount: '1勺' },
      { name: '黄油', amount: '1小块' },
    ],
    steps: [
      { content: '鸡蛋打散，加牛奶和白糖搅匀；厚吐司两面浸入蛋奶液中，让吐司充分吸饱液体（每面约 30 秒）。', time: 4, tip: '吐司要充分吸液，否则里面还是干的' },
      { content: '平底锅中火融化黄油，放入吐司，两面各煎约 2 分钟，至表面金黄。', time: 5, tip: '用黄油煎，香气远胜普通油' },
      { content: '出锅切斜角，可配枫糖浆、蜂蜜或新鲜草莓。', time: 1 },
    ],
    nutritionAnalysis: '鸡蛋提供蛋白质，吐司补充碳水，黄油增加风味，是满足感极强的甜早餐。'
  },
  {
    id: 60,
    title: '鸡蛋灌饼',
    quote: '鸡蛋灌饼是典型的中国北方路边摊早餐，一个摊子一口铁板，边角料里藏着最质朴的早餐哲学',
    rating: 4.7, count: 2100, emoji: '🥚',
    difficulty: '中等', time: 20, tags: ['早餐', '北方菜', '鸡蛋'],
    ingredients: [
      { name: '薄饼皮', amount: '2张（购买现成）' }, { name: '鸡蛋', amount: '2个' },
      { name: '生菜', amount: '适量' }, { name: '甜面酱', amount: '1勺' },
      { name: '辣椒酱', amount: '适量' },
    ],
    steps: [
      { content: '平底锅中火预热，放入饼皮，加热 30 秒后翻面。', time: 2 },
      { content: '用筷子在饼皮边缘戳一个小口，将打好的蛋液从小口灌入，让蛋液在饼皮夹层中扩散。', time: 2, tip: '蛋液灌入量不要太多，否则容易破皮' },
      { content: '继续在锅中加热翻面，约 2 分钟，让鸡蛋在饼皮内凝固。', time: 3 },
      { content: '取出，抹上甜面酱和辣椒酱，放生菜，对折或卷起即可食用。', time: 1 },
    ],
    nutritionAnalysis: '薄饼提供碳水，鸡蛋补充蛋白，生菜提供维生素，是快速充能的路边经典早餐。'
  },
  {
    id: 61,
    title: '豆浆油条',
    quote: '豆浆油条是中国最具代表性的早餐组合，豆浆的大豆异黄酮与油条形成完美的「中式蛋白能量早餐」',
    rating: 4.6, count: 3800, emoji: '🫘',
    difficulty: '简单', time: 10, tags: ['早餐', '传统', '家常'],
    ingredients: [
      { name: '豆浆', amount: '400ml（买现成的）' }, { name: '油条', amount: '2根（买现成）' },
      { name: '白糖', amount: '适量（可选）' },
    ],
    steps: [
      { content: '豆浆加热至 80~85°C（冒热气但不沸腾），加适量白糖搅匀。', time: 5, tip: '不要煮到大沸腾，否则豆浆里的蛋白质会凝固成豆皮颗粒' },
      { content: '油条放入烤箱 180°C 复热 3 分钟，让外皮重新变脆。', time: 4 },
      { content: '将油条撕成小段，蘸豆浆吃，或直接泡入豆浆中。', time: 1 },
    ],
    nutritionAnalysis: '豆浆每 100ml 约含 3.6g 植物蛋白，大豆异黄酮对心血管有保护作用，是经济实惠的蛋白来源。'
  },
  {
    id: 62,
    title: '酸奶水果碗',
    quote: '希腊酸奶经过滤去除大量乳清，蛋白质是普通酸奶的 2~3 倍，是补充优质蛋白的聪明方式',
    rating: 4.7, count: 1500, emoji: '🍓',
    difficulty: '简单', time: 5, tags: ['早餐', '快手', '健康'],
    ingredients: [
      { name: '希腊酸奶', amount: '150g' }, { name: '草莓', amount: '5个' },
      { name: '蓝莓', amount: '20g' }, { name: '香蕉', amount: '半根' },
      { name: '燕麦', amount: '2勺' }, { name: '蜂蜜', amount: '1小勺' },
    ],
    steps: [
      { content: '将希腊酸奶舀入碗中，用勺子轻轻抹平，打好基底。', time: 1 },
      { content: '草莓对切，香蕉切片，与蓝莓一同摆放在酸奶上，注意颜色搭配美观。', time: 2 },
      { content: '撒上燕麦片，淋一小勺蜂蜜，即可食用。', time: 1 },
    ],
    nutritionAnalysis: '希腊酸奶含益生菌，每份约 15g 蛋白，草莓富含维生素 C，蓝莓花青素丰富，热量约 250 大卡。'
  },
  {
    id: 63,
    title: '溏心荷包蛋',
    quote: '「溏心蛋」要求蛋白全熟而蛋黄保持流心，需要精准控温——太低蛋白不熟，太高蛋黄凝固',
    rating: 4.8, count: 2800, emoji: '🍳',
    difficulty: '简单', time: 8, tags: ['早餐', '快手', '鸡蛋'],
    ingredients: [
      { name: '鸡蛋', amount: '2个（室温）' }, { name: '食用油', amount: '少量' },
    ],
    steps: [
      { content: '平底锅中小火加热，加少许油，油温升至约 70°C（油不起烟，轻轻倾斜锅面油会缓缓流动）。', time: 2, tip: '油温是关键，太热蛋白起泡不均匀' },
      { content: '轻轻打入鸡蛋，不要移动，保持中小火，盖上锅盖（或沿锅边淋一小勺水），焖 2~2.5 分钟。', time: 3, tip: '加盖或加水焖，利用蒸汽把蛋白顶部蒸熟，蛋黄不会被热油划破' },
      { content: '用铲子轻轻检查蛋白是否凝固，蛋黄表面有一层薄膜但内部仍软时即可出锅，加盐和黑胡椒。', time: 1 },
    ],
    nutritionAnalysis: '溏心蛋的蛋黄中卵磷脂不被高温破坏，保留最多营养；每个鸡蛋约 6g 蛋白，70 大卡。'
  },

  // ==================== 其他家常（17 道）====================
  {
    id: 64,
    title: '快手牛肉炒意面',
    quote: '意大利面条约有 700 年历史，传入中国后经本土化改造，中式炒制技法反而让意面更香',
    rating: 4.9, count: 850, emoji: '🍝',
    difficulty: '中等', time: 25, tags: ['主食', '意面', '牛肉'],
    ingredients: [
      { name: '意面', amount: '100g' }, { name: '牛排', amount: '150g（或牛肉片）' },
      { name: '洋葱', amount: '半个' }, { name: '大蒜', amount: '2瓣' },
      { name: '黑椒汁', amount: '2勺' }, { name: '黄油', amount: '1小块' },
    ],
    steps: [
      { content: '意面入沸水加盐，煮至比包装说明少 1 分钟（八九成熟），捞出加少量橄榄油拌匀防粘。', time: 10, tip: '意面留一点点嚼劲（al dente），炒时再煮就正好' },
      { content: '牛排切条，用盐、黑胡椒、少量生粉腌制；洋葱切丝，蒜切末。', time: 5 },
      { content: '锅中黄油融化，大火翻炒牛肉至变色，加洋葱蒜末炒香，约 3 分钟。', time: 4 },
      { content: '放入意面，倒黑椒汁，大火翻炒均匀，让每根面条都裹上酱汁，约 2 分钟出锅。', time: 2, tip: '加少量煮面水，让酱汁更好地裹住面条' },
    ],
    nutritionAnalysis: '碳水和蛋白质搭配均衡，黑椒抗氧化，洋葱中的槲皮素对心血管有益。'
  },
  {
    id: 65,
    title: '麻辣香锅',
    quote: '麻辣香锅源于四川，是介于火锅和炒菜之间的江湖菜，「百样食材一锅炒」是其最大特点',
    rating: 4.8, count: 3400, emoji: '🌶️',
    difficulty: '中等', time: 30, tags: ['炒菜', '川菜', '香锅'],
    ingredients: [
      { name: '土豆', amount: '1个' }, { name: '藕', amount: '半节' },
      { name: '豆腐干', amount: '100g' }, { name: '鸡翅根', amount: '4个' },
      { name: '香辣底料', amount: '2勺' }, { name: '干辣椒', amount: '5个' },
      { name: '花椒', amount: '1小勺' }, { name: '大蒜', amount: '5瓣' },
    ],
    steps: [
      { content: '所有蔬菜切片/块；鸡翅根剁开，用盐和料酒腌制；土豆藕片提前焯水 2 分钟。', time: 10 },
      { content: '热锅宽油，将鸡翅根炸至金黄，捞出；豆腐干炸至表皮微皱，捞出。', time: 8, tip: '先炸让食材锁住内部汁水，再炒才有层次感' },
      { content: '锅中留少量油，放干辣椒、花椒小火炸香，加香辣底料和大蒜炒出红油。', time: 4 },
      { content: '放入所有食材翻炒均匀，加生抽、少量糖调味，翻炒 2 分钟出锅，撒芝麻和葱花。', time: 3 },
    ],
    nutritionAnalysis: '食材丰富多样，辣椒素促进代谢，花椒有麻痹口腔神经的特殊体验，属于高刺激的享受性饮食。'
  },
  {
    id: 66,
    title: '香炸排骨',
    quote: '排骨提前用嫩肉粉或苏打粉腌制，能破坏肌肉纤维，炸出来的排骨外酥里嫩，比直接炸嫩 3 倍',
    rating: 4.7, count: 1800, emoji: '🍖',
    difficulty: '中等', time: 30, tags: ['炸菜', '排骨', '香脆'],
    ingredients: [
      { name: '猪排骨', amount: '500g（小排）' }, { name: '生抽', amount: '3勺' },
      { name: '料酒', amount: '2勺' }, { name: '生粉', amount: '3勺' },
      { name: '五香粉', amount: '1小勺' }, { name: '大蒜', amount: '3瓣' },
    ],
    steps: [
      { content: '小排剁约 3cm 段，加生抽、料酒、五香粉、蒜末腌制 20 分钟，加入生粉抓匀。', time: 22, tip: '腌制时间越长越入味，最好腌一晚' },
      { content: '锅中倒油，油温升至约 170°C（放一小块面包会立刻浮起变金黄），下排骨中火炸 4 分钟。', time: 6, tip: '油温不够高，排骨会吸油变腻' },
      { content: '捞出排骨，油温升至 180°C，复炸 1 分钟至外皮更酥脆，捞出控油。', time: 3, tip: '复炸是炸排骨酥脆的关键，不可跳过' },
      { content: '出锅撒椒盐或配甜辣酱食用。', time: 1 },
    ],
    nutritionAnalysis: '炸制方式热量较高，建议偶尔享用；排骨含丰富钙质和蛋白质。'
  },
  {
    id: 67,
    title: '蚝油牛肉',
    quote: '蚝油是粤菜最重要的调料之一，由牡蛎熬制，味道咸鲜微甜，让任何食材都增添鲜味层次',
    rating: 4.7, count: 2100, emoji: '🥩',
    difficulty: '中等', time: 20, tags: ['炒菜', '牛肉', '粤菜'],
    ingredients: [
      { name: '牛肉', amount: '300g（嫩牛肉）' }, { name: '蚝油', amount: '2勺' },
      { name: '生抽', amount: '1勺' }, { name: '生粉', amount: '2勺' },
      { name: '姜', amount: '3片' }, { name: '葱', amount: '3根' },
    ],
    steps: [
      { content: '牛肉逆纹切 0.3cm 薄片，加生抽、生粉、食用油腌制 10 分钟（加油可以锁住水分）。', time: 12, tip: '「逆纹切」是牛肉嫩滑的关键，顺纹切就老了' },
      { content: '热锅宽油，油温七成热时下牛肉片，大火快速翻炒至变色，约 1 分钟，盛出（不要全熟）。', time: 2 },
      { content: '原锅留底油，中火炒香姜片，放入葱段翻炒 30 秒。', time: 1 },
      { content: '放回牛肉，淋蚝油，大火翻炒均匀，约 30 秒出锅。', time: 1, tip: '蚝油加热时间不能长，否则会变苦' },
    ],
    nutritionAnalysis: '牛肉铁含量是猪肉的 2 倍，蚝油带来鲜味同时减少食盐用量，是简单却高档的家常菜。'
  },
  {
    id: 68,
    title: '干锅花椰菜',
    quote: '花椰菜（菜花）含有一种叫「吲哚素」的化合物，被认为能抑制某些致癌物质的活性',
    rating: 4.7, count: 1600, emoji: '🥦',
    difficulty: '简单', time: 18, tags: ['炒菜', '素食', '干锅'],
    ingredients: [
      { name: '花椰菜', amount: '半颗（约 400g）' }, { name: '五花肉', amount: '100g（可选）' },
      { name: '干辣椒', amount: '4个' }, { name: '郫县豆瓣酱', amount: '1勺' },
      { name: '生抽', amount: '2勺' }, { name: '大蒜', amount: '4瓣' },
    ],
    steps: [
      { content: '花椰菜切小朵，加少量盐焯水 1 分钟，捞出沥干；五花肉切薄片。', time: 5, tip: '焯水去掉生气，也能缩短炒制时间' },
      { content: '锅中不加油，放五花肉片，中火慢煎至出油，加蒜和干辣椒炒香。', time: 4 },
      { content: '加豆瓣酱炒出红油，放入花椰菜大火翻炒 3 分钟。', time: 4 },
      { content: '加生抽调味，继续翻炒 1 分钟，出锅前撒葱花。', time: 2, tip: '要炒至花椰菜稍有焦香味，才有干锅的感觉' },
    ],
    nutritionAnalysis: '花椰菜膳食纤维丰富，每 100g 约 25 大卡，素食版本热量极低，是减脂友好菜。'
  },
  {
    id: 69,
    title: '锅贴',
    quote: '锅贴与饺子同源，区别在于底部焦香、外酥里嫩，「煎」比「煮」多了一层焦糊香气',
    rating: 4.8, count: 2800, emoji: '🥟',
    difficulty: '中等', time: 25, tags: ['主食', '煎饺', '北方菜'],
    ingredients: [
      { name: '饺子皮', amount: '30张（买现成）' }, { name: '猪肉末', amount: '200g' },
      { name: '白菜', amount: '200g' }, { name: '生抽', amount: '2勺' },
      { name: '姜末', amount: '1勺' }, { name: '香油', amount: '1勺' },
    ],
    steps: [
      { content: '白菜切末，加盐腌制 5 分钟后挤干水分；猪肉末加生抽、姜末、香油顺时针搅上劲，拌入白菜。', time: 8, tip: '肉馅搅上劲，锅贴内馅才 Q 弹多汁' },
      { content: '饺子皮放入适量馅料，对折捏紧中间，两端留口（不封口）。', time: 8, tip: '锅贴两端不封口，煎制时可向外延伸，形成漂亮的翅膀' },
      { content: '平底锅加油，锅贴整齐摆入，中火煎 2 分钟至底部金黄。', time: 4 },
      { content: '倒入面粉水（面粉:水=1:10），水量淹到锅贴 1/3，加盖中火焖 8 分钟至水干，开盖再煎 1 分钟至底部酥脆。', time: 10, tip: '面粉水产生的焦脆底壳是锅贴最好吃的部分' },
    ],
    nutritionAnalysis: '猪肉末提供蛋白质，白菜清爽，煎制的底部脆壳增加了饱腹感，是扎实的主食。'
  },
  {
    id: 70,
    title: '蛋包饭',
    quote: '蛋包饭（Omurice）由日本西餐厅创制，1900 年代传入中国，融合了法式蛋卷和炒饭的精华',
    rating: 4.7, count: 1900, emoji: '🍳',
    difficulty: '中等', time: 20, tags: ['主食', '日式', '鸡蛋'],
    ingredients: [
      { name: '米饭', amount: '1.5碗' }, { name: '鸡蛋', amount: '3个' },
      { name: '鸡腿肉', amount: '100g（切丁）' }, { name: '番茄酱', amount: '3勺' },
      { name: '洋葱', amount: '1/4个（切丁）' },
    ],
    steps: [
      { content: '鸡腿肉丁加盐腌制；热锅下油，炒香洋葱丁，放入鸡腿肉炒熟，加米饭和番茄酱翻炒均匀，调味出锅成番茄炒饭。', time: 8, tip: '炒饭加番茄酱后要大火快炒，让每粒米都红润' },
      { content: '另起锅，少量黄油融化，倒入 3 个打散的蛋液，形成半凝固状的蛋皮（边缘凝固、中间还嫩）。', time: 3, tip: '全程中小火，蛋皮要嫩不能炒老，像奶油般柔软' },
      { content: '在蛋皮中央放番茄炒饭，用锅铲辅助将蛋皮包裹饭团，翻扣到盘中。', time: 2, tip: '用托的方法，不用翻的——让蛋包饭自然翻落在盘子上' },
      { content: '在蛋包饭上淋番茄酱，用刀划开，让内部嫩蛋液流出。', time: 1 },
    ],
    nutritionAnalysis: '鸡蛋高蛋白，米饭提供碳水，是外形漂亮、营养均衡的完整一餐。'
  },
  {
    id: 71,
    title: '手撕包菜',
    quote: '「手撕」而非刀切，是让包菜保持自然断面，炒制时受热面积不规则，更容易出现焦糊锅气香',
    rating: 4.7, count: 3200, emoji: '🥬',
    difficulty: '简单', time: 12, tags: ['炒菜', '素食', '快手'],
    ingredients: [
      { name: '包菜', amount: '半颗（约 400g）' }, { name: '干辣椒', amount: '4个' },
      { name: '大蒜', amount: '4瓣' }, { name: '生抽', amount: '2勺' },
    ],
    steps: [
      { content: '包菜用手撕成约 5cm 的不规则块状，洗净沥干；干辣椒剪段，大蒜拍扁。', time: 4, tip: '撕的时候要顺着叶脉，菜的纤维才有口感' },
      { content: '锅大火烧至冒烟，倒入油，放干辣椒和大蒜爆香约 30 秒。', time: 1, tip: '锅要够热才有锅气，这是关键' },
      { content: '大火下包菜，快速翻炒，中途不要加盖，保持大火约 3 分钟至菜稍微软化但仍有脆感。', time: 4, tip: '全程大火，绝对不盖锅盖，否则出水变软烂' },
      { content: '淋生抽，加盐，翻炒均匀 30 秒，出锅。', time: 1 },
    ],
    nutritionAnalysis: '包菜含丰富维生素 C 和 K，高温短炒保留营养，热量极低，是日常最健康的炒蔬菜之一。'
  },
  {
    id: 72,
    title: '西红柿炖豆腐',
    quote: '豆腐与番茄搭配是完美的营养互补：豆腐中的钙与番茄的维生素 C 同食，促进钙吸收',
    rating: 4.5, count: 1100, emoji: '🍅',
    difficulty: '简单', time: 18, tags: ['炖煮', '素食', '豆腐'],
    ingredients: [
      { name: '嫩豆腐', amount: '400g' }, { name: '番茄', amount: '2个' },
      { name: '葱', amount: '2根' }, { name: '生抽', amount: '2勺' },
    ],
    steps: [
      { content: '豆腐切 2cm 方块，加盐水浸泡 5 分钟沥干；番茄切大块。', time: 7 },
      { content: '热锅下油，放番茄大火炒出汁，加少量糖。', time: 4 },
      { content: '加入豆腐，轻轻翻动，倒入少量水，加盐和生抽，中火炖 5 分钟。', time: 6, tip: '豆腐用推的，别翻炒，容易碎' },
      { content: '出锅撒葱花，可配白米饭。', time: 1 },
    ],
    nutritionAnalysis: '豆腐是优质植物蛋白，番茄提供维生素 C，炖制更易消化，老人小孩都适合。'
  },
  {
    id: 73,
    title: '芋头排骨汤',
    quote: '芋头富含黏液蛋白（即「芋头滑」），加热后形成天然增稠剂，让汤底变得自然绵滑',
    rating: 4.6, count: 1200, emoji: '🍲',
    difficulty: '简单', time: 55, tags: ['汤类', '排骨', '秋冬'],
    ingredients: [
      { name: '猪排骨', amount: '400g' }, { name: '芋头', amount: '300g' },
      { name: '生姜', amount: '4片' }, { name: '葱', amount: '2根' },
    ],
    steps: [
      { content: '排骨焯水洗净；芋头去皮切块（带一次性手套，芋头汁会让皮肤痒）。', time: 8, tip: '戴手套处理芋头，或将芋头直接在火上烤一下让手套黏液变干' },
      { content: '砂锅加清水，放排骨和姜片，大火烧开转小火炖 35 分钟。', time: 38 },
      { content: '加入芋头块，继续炖 15 分钟至芋头软糯，加盐调味，撒葱花。', time: 16, tip: '芋头炖太久会化成糊，要注意时间' },
    ],
    nutritionAnalysis: '芋头膳食纤维丰富，升糖指数低，与排骨同炖营养互补，秋冬暖胃佳品。'
  },
  {
    id: 74,
    title: '雪菜黄鱼',
    quote: '雪菜（雪里蕻）是中国特有的腌制蔬菜，含天然益生菌，与鱼同烧可去腥增鲜',
    rating: 4.6, count: 1000, emoji: '🐟',
    difficulty: '中等', time: 25, tags: ['炖煮', '鱼类', '家常'],
    ingredients: [
      { name: '小黄鱼', amount: '3条（约 600g）' }, { name: '雪菜', amount: '100g' },
      { name: '生姜', amount: '4片' }, { name: '料酒', amount: '2勺' },
      { name: '生抽', amount: '2勺' },
    ],
    steps: [
      { content: '黄鱼处理干净，吸干水分，两面抹少许盐和料酒腌制 5 分钟；雪菜切段。', time: 7, tip: '黄鱼肉嫩，腌制不要超过 10 分钟，会变咸' },
      { content: '热锅油，将黄鱼两面煎至金黄，每面约 2 分钟，小心翻面。', time: 6, tip: '锅要充分预热，鱼皮才不粘底' },
      { content: '放入姜片、雪菜，加热水没过鱼身，加料酒和生抽，中火炖 10 分钟。', time: 12, tip: '雪菜本身有咸味，生抽要适量放' },
      { content: '出锅撒葱花，配白米饭。', time: 1 },
    ],
    nutritionAnalysis: '黄鱼蛋白质丰富、脂肪少，雪菜含益生菌，两者搭配鲜美无比。'
  },
  {
    id: 75,
    title: '蒜苔炒猪肉',
    quote: '蒜苔是大蒜的花茎，含有大量大蒜素（allicin），比蒜瓣更脆嫩，炒猪肉是大众口味中最下饭的组合之一',
    rating: 4.7, count: 2400, emoji: '🌿',
    difficulty: '简单', time: 15, tags: ['炒菜', '家常', '快手'],
    ingredients: [
      { name: '蒜苔', amount: '200g' }, { name: '猪里脊', amount: '200g' },
      { name: '红辣椒', amount: '1个' }, { name: '生抽', amount: '2勺' },
    ],
    steps: [
      { content: '里脊切薄片，加生抽、生粉腌制；蒜苔切 4cm 段，红辣椒切圈。', time: 7 },
      { content: '热锅下油，大火滑炒猪肉片至变色，约 1 分钟，盛出备用。', time: 2, tip: '猪肉要大火快炒，避免脱水变老' },
      { content: '原锅下辣椒和蒜苔，大火翻炒 2 分钟，蒜苔颜色变翠绿微软时放回猪肉。', time: 3 },
      { content: '加盐和生抽翻炒均匀，30 秒出锅。', time: 1 },
    ],
    nutritionAnalysis: '蒜苔含大蒜素有抗菌功效，里脊肉脂肪少，是简单高效的家常下饭菜。'
  },
  {
    id: 76,
    title: '洋葱牛肉炒饭',
    quote: '洋葱经过高温翻炒，辛辣物质转化为甜味物质，与牛肉搭配形成绝佳的自然鲜甜',
    rating: 4.7, count: 1800, emoji: '🍳',
    difficulty: '简单', time: 18, tags: ['主食', '炒饭', '牛肉'],
    ingredients: [
      { name: '隔夜米饭', amount: '2碗' }, { name: '牛肉片', amount: '150g' },
      { name: '洋葱', amount: '1个' }, { name: '鸡蛋', amount: '2个' },
      { name: '生抽', amount: '2勺' }, { name: '黑椒汁', amount: '1勺' },
    ],
    steps: [
      { content: '牛肉片用黑椒汁、盐腌制；洋葱切丝；鸡蛋打散；米饭捏散。', time: 5 },
      { content: '热锅下油，先炒洋葱至软化透明，约 3 分钟，盛出备用。', time: 4 },
      { content: '原锅大火，下蛋液快炒成蛋花，下米饭翻炒 3 分钟，加生抽炒出锅气。', time: 5 },
      { content: '放入牛肉片翻炒至变色，加回洋葱，混合均匀出锅。', time: 2, tip: '牛肉最后放，大火快炒保持嫩滑' },
    ],
    nutritionAnalysis: '洋葱含槲皮素，牛肉提供铁和蛋白质，炒饭快速补充碳水，是完整一餐。'
  },
  {
    id: 77,
    title: '剩菜煎饼',
    quote: '「物尽其用」是中国家庭厨房的最高哲学，前一天的剩菜用面粉和鸡蛋拌一拌，就变成了全新的早餐',
    rating: 4.5, count: 1500, emoji: '🥞',
    difficulty: '简单', time: 15, tags: ['早餐', '快手', '不浪费'],
    ingredients: [
      { name: '剩饭菜', amount: '150g（蔬菜、米饭均可）' }, { name: '鸡蛋', amount: '2个' },
      { name: '面粉', amount: '50g' }, { name: '葱', amount: '2根' },
    ],
    steps: [
      { content: '剩菜切碎，与鸡蛋、面粉、葱花混合，加少量盐和黑胡椒，搅匀成均匀的面糊（可加少量水调整稠度）。', time: 5, tip: '面糊稠度以舀起来缓缓流下为准' },
      { content: '平底锅中火加油，舀一勺面糊倒入，轻压成厚约 1cm 的圆饼，中小火煎 3 分钟。', time: 4 },
      { content: '翻面，再煎 2~3 分钟至两面金黄，重复直至面糊用完。', time: 5, tip: '小火煎才能内部熟透外表不焦' },
    ],
    nutritionAnalysis: '鸡蛋提供蛋白，面粉提供碳水，把剩菜的营养充分利用，零浪费的家庭智慧。'
  },
  {
    id: 78,
    title: '香菇滑鸡粥',
    quote: '香菇中的 β-葡聚糖是最受研究证实的天然免疫调节物质，与鸡肉同煮是中式「病号饭」里最温柔的',
    rating: 4.7, count: 1800, emoji: '🍄',
    difficulty: '简单', time: 45, tags: ['粥类', '家常', '养生'],
    ingredients: [
      { name: '大米', amount: '100g' }, { name: '鸡腿', amount: '1个' },
      { name: '香菇', amount: '4朵（鲜）' }, { name: '生姜', amount: '4片' },
      { name: '生粉', amount: '1勺' }, { name: '生抽', amount: '1勺' },
    ],
    steps: [
      { content: '鸡腿去骨切薄片，加生粉、生抽、料酒腌制；米洗净加少量油腌制 10 分钟；香菇切丝。', time: 12 },
      { content: '锅中加清水约 1L，大火烧开后放米，转中小火熬粥 25 分钟至浓稠。', time: 28, tip: '提前腌米，熬出的粥更绵滑' },
      { content: '放入香菇丝，再熬 5 分钟；放入腌好的鸡片，用筷子拨散，中火煮 3 分钟至熟。', time: 8, tip: '鸡肉最后放，保持嫩滑不老' },
      { content: '加盐调味，出锅放姜丝、葱花，滴几滴香油。', time: 1 },
    ],
    nutritionAnalysis: '粥易消化，香菇提升免疫，鸡肉高蛋白，是病后恢复、胃口不好时的最佳选择。'
  },
  {
    id: 79,
    title: '番茄炒牛肉',
    quote: '牛肉中的铁是血红素铁，与番茄维生素 C 同食，吸收率比单纯补铁剂还高',
    rating: 4.7, count: 2300, emoji: '🍅',
    difficulty: '简单', time: 18, tags: ['炒菜', '牛肉', '番茄'],
    ingredients: [
      { name: '牛肉', amount: '200g' }, { name: '番茄', amount: '2个' },
      { name: '大蒜', amount: '2瓣' }, { name: '生抽', amount: '2勺' },
      { name: '生粉', amount: '1勺' }, { name: '糖', amount: '半勺' },
    ],
    steps: [
      { content: '牛肉逆纹切薄片，加生粉、生抽、少量盐和食用油腌制 10 分钟；番茄切大块，蒜切末。', time: 12, tip: '腌制时加油是锁水的技巧，牛肉炒出来不干柴' },
      { content: '热锅宽油，大火下牛肉翻炒至变色，约 1 分钟，盛出备用。', time: 2 },
      { content: '原锅加少量油，放蒜末爆香，下番茄大火翻炒出汁，加少许糖。', time: 3, tip: '番茄要充分炒出汁，汤汁多才好拌饭' },
      { content: '放回牛肉，翻炒均匀，加盐调味，撒葱花出锅。', time: 1 },
    ],
    nutritionAnalysis: '番茄和牛肉的营养组合是教科书级别的：铁+维生素 C，吸收率大幅提高，适合贫血人群。'
  },
  {
    id: 80,
    title: '三杯鸡',
    quote: '「三杯鸡」源自江西，名称来自「一杯米酒、一杯酱油、一杯猪油」，是台湾九份老街的招牌菜',
    rating: 4.8, count: 2100, emoji: '🍗',
    difficulty: '中等', time: 30, tags: ['炒菜', '台湾菜', '鸡肉'],
    ingredients: [
      { name: '鸡腿', amount: '2个（剁小块）' }, { name: '米酒', amount: '3勺' },
      { name: '生抽', amount: '3勺' }, { name: '糖', amount: '1勺' },
      { name: '大蒜', amount: '6瓣' }, { name: '生姜', amount: '5片' },
      { name: '新鲜罗勒', amount: '一把' },
    ],
    steps: [
      { content: '鸡腿剁小块，冷水焯水 2 分钟去血沫，捞出沥干备用。', time: 6 },
      { content: '砂锅中少量油，放入姜片和大蒜，中火煎至金黄出香。', time: 3, tip: '大蒜要煎到金黄，是三杯鸡甜香的来源' },
      { content: '放入鸡块，大火翻炒约 3 分钟至表皮金黄，加米酒、生抽、糖，大火烧开。', time: 6 },
      { content: '转中小火加盖焖 12 分钟，开盖大火收汁，汤汁浓稠时放入罗勒，翻炒 30 秒出锅。', time: 14, tip: '罗勒最后放，高温会让香气瞬间爆发' },
    ],
    nutritionAnalysis: '鸡腿含丰富蛋白质，米酒的酒精在烹饪中完全挥发，罗勒含芳香物质有助于消化。'
  },
]
