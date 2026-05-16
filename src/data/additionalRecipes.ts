import type { Recipe } from '../types/recipe'

type Method =
  | 'stir'
  | 'braise'
  | 'steam'
  | 'soup'
  | 'noodle'
  | 'rice'
  | 'cold'
  | 'breakfast'
  | 'dumpling'

interface Seed {
  id: number
  title: string
  quote: string
  emoji: string
  difficulty: Recipe['difficulty']
  time: number
  tags: string[]
  ingredients: { name: string; amount: string }[]
  method: Method
  nutritionAnalysis: string
}

const METHOD_STEPS: Record<Method, (seed: Seed) => NonNullable<Recipe['steps']>> = {
  stir: (s) => [
    { content: `将${s.ingredients.slice(0, 2).map(i => i.name).join('、')}分别处理成适口大小，炒锅中火预热，先把葱姜蒜或辛香料备好，方便后续快速下锅。`, time: 6, tip: '快炒菜要先备齐食材，避免下锅后手忙脚乱。' },
    { content: '炒锅倒入 2 勺油，中大火烧至油面微微流动，先下肉类或耐炒食材快速滑散，炒到变色后盛出备用。', time: 4, tip: '先滑炒主料，能保持嫩度和清爽口感。' },
    { content: '锅中留底油，放入蔬菜或配料大火翻炒 1 到 3 分钟，看到颜色变亮、边缘略软时再调入生抽或盐。', time: 4 },
    { content: '把主料倒回锅中，保持大火快速翻匀，让调料均匀裹住食材，出锅前尝味补盐，趁热装盘。', time: 3, tip: '最后 1 分钟大火收味，锅气会更明显。' },
  ],
  braise: (s) => [
    { content: `${s.ingredients[0].name}切成均匀块状，冷水入锅加姜片和料酒，大火煮沸后撇净浮沫，捞出冲洗并沥干。`, time: 8, tip: '焯水能去腥，也能让汤汁更清亮。' },
    { content: '炒锅中小火加少量油，放冰糖或酱料炒出香气，再下主料翻炒上色，表面微微收紧即可。', time: 6 },
    { content: '加入热水没过食材，放生抽、老抽、香料或配菜，大火煮开后转小火加盖慢炖至软烂。', time: Math.max(20, s.time - 15), tip: '炖煮类一定用热水，肉质更容易软而不柴。' },
    { content: '开盖转大火收汁，汤汁变得浓稠发亮时翻动几下，让每块食材裹上酱汁后出锅。', time: 5, tip: '收汁阶段别离开锅，糖色容易粘底。' },
  ],
  steam: (s) => [
    { content: `将${s.ingredients[0].name}处理干净并擦干水分，按菜品需要切块、划刀或码盘，撒少许盐和姜葱去腥。`, time: 6 },
    { content: '蒸锅加入足量清水，大火烧到上汽后再放入蒸盘，保持大火或中大火稳定蒸制。', time: Math.max(8, s.time - 8), tip: '水开后再蒸，时间更准确，口感更稳定。' },
    { content: '蒸好后先倒掉盘中腥水，再淋入蒸鱼豉油、生抽或调味汁，重新铺上葱姜丝。', time: 2 },
    { content: '小锅烧热 1 到 2 勺油，油面微微冒烟时趁热泼在葱姜上，激出香气后立即上桌。', time: 2, tip: '热油爆香是清蒸菜的最后一层香气。' },
  ],
  soup: (s) => [
    { content: `${s.ingredients[0].name}洗净切块，肉类先冷水焯水，蔬菜类直接备用；砂锅或汤锅提前加足清水。`, time: 8 },
    { content: '把耐煮食材放入汤锅，大火烧开后撇去浮沫，转小火保持微微翻滚，慢慢熬出鲜味。', time: Math.max(20, s.time - 15), tip: '小火慢熬比大火猛煮更清甜。' },
    { content: '临近出锅前放入易熟蔬菜、豆腐或蛋液，中火再煮 3 到 8 分钟，保持食材口感。', time: 6 },
    { content: '最后加盐调味，撒葱花或香菜，滴少量香油，趁热盛出，汤味清爽不厚重。', time: 1 },
  ],
  noodle: (s) => [
    { content: '汤锅加足量清水，大火烧开后下面条，按包装时间少煮 30 秒到 1 分钟，捞出保持弹性。', time: 8, tip: '面条略带筋道，后续拌炒或入汤才不会烂。' },
    { content: '炒锅或汤锅中火处理浇头，先爆香葱姜蒜，再放主料和配菜，炒到香味明显。', time: 6 },
    { content: '加入酱汁、汤底或少量煮面水，中火煮到味道融合，汤汁能挂在面条上即可。', time: 5 },
    { content: '把面条放入碗中或回锅拌匀，撒葱花、香菜或辣椒油，趁热食用口感最好。', time: 2 },
  ],
  rice: (s) => [
    { content: '米饭提前打散，鸡蛋或肉类分开处理，蔬菜切丁备用；炒锅大火预热到锅面明显发热。', time: 5 },
    { content: '锅中下油，先炒蛋或主料至刚熟盛出，再用底油爆香葱花和配菜，炒出香气。', time: 5 },
    { content: '倒入米饭，大火持续翻炒并用锅铲压散结块，让米粒变得松散、表面微微发亮。', time: 5, tip: '隔夜饭含水量低，更容易炒到粒粒分明。' },
    { content: '放回主料，沿锅边淋生抽或酱汁，快速翻匀，最后撒葱花即可出锅。', time: 2 },
  ],
  cold: (s) => [
    { content: `将${s.ingredients[0].name}清洗干净，按口感切片、拍裂或撕成小块，能焯水的食材先入沸水处理。`, time: 5 },
    { content: '焯好的食材立刻过冷水并沥干，保持脆感；蒜末、香菜、小米辣等调味料提前备好。', time: 4, tip: '凉菜水分要沥干，否则调味会被冲淡。' },
    { content: '小碗中加入生抽、醋、香油、糖和少量盐，按口味补辣椒油或花椒油，搅拌成汁。', time: 2 },
    { content: '把调味汁倒入食材中，轻轻翻拌均匀，静置 3 分钟入味后装盘。', time: 3 },
  ],
  breakfast: (s) => [
    { content: '先准备主食基底，将吐司、燕麦、米或面糊处理好；平底锅或小汤锅用中小火预热。', time: 4 },
    { content: '加入蛋、奶、豆浆或水果等主要食材，保持中小火慢慢加热，避免外焦内生或糊底。', time: Math.max(5, s.time - 8), tip: '早餐更看重稳定口感，中小火比大火更保险。' },
    { content: '根据口味加入少量糖、盐、蜂蜜或黑胡椒，搅拌或翻面至食材熟透。', time: 3 },
    { content: '装盘后搭配水果、坚果或葱花点缀，趁热吃能保持最佳口感。', time: 1 },
  ],
  dumpling: (s) => [
    { content: '先处理馅料，蔬菜切碎挤水，肉馅加入生抽、姜末和香油，顺一个方向搅打到发黏。', time: 12, tip: '馅料搅上劲，熟后才会多汁有弹性。' },
    { content: '取饺子皮或面团剂子，包入适量馅料，边缘捏紧，放在撒了薄粉的盘中防粘。', time: Math.max(12, s.time - 18) },
    { content: '煮锅水大火烧开后下锅，轻推防粘，水开后点 2 次冷水，饺子全部浮起即可。', time: 8 },
    { content: '若做煎饺，平底锅中火煎到底部金黄，再倒入面粉水加盖焖熟，开盖收干成脆底。', time: 6, tip: '煎饺最后开盖收水，底部才会酥脆。' },
  ],
}

const SEEDS: Seed[] = [
  { id: 81, title: '糖醋排骨', quote: '江浙家常宴客菜，酸甜比例决定成败。', emoji: '🍖', difficulty: '中等', time: 45, tags: ['糖醋', '排骨', '下饭'], ingredients: [{ name: '猪排骨', amount: '500g' }, { name: '冰糖', amount: '20g' }, { name: '香醋', amount: '3勺' }, { name: '生抽', amount: '2勺' }], method: 'braise', nutritionAnalysis: '排骨提供蛋白质和钙，酸甜口味开胃但糖量较高。' },
  { id: 82, title: '梅菜扣肉', quote: '客家硬菜代表，肥而不腻靠的是蒸制回软。', emoji: '🥩', difficulty: '复杂', time: 90, tags: ['蒸菜', '猪肉', '宴客'], ingredients: [{ name: '五花肉', amount: '500g' }, { name: '梅干菜', amount: '120g' }, { name: '老抽', amount: '1勺' }, { name: '冰糖', amount: '10g' }], method: 'steam', nutritionAnalysis: '五花肉能量较高，梅干菜增加咸鲜和膳食纤维。' },
  { id: 83, title: '东坡肉', quote: '慢火少水，是时间给五花肉的温柔。', emoji: '🥩', difficulty: '复杂', time: 120, tags: ['红烧', '猪肉', '宴客'], ingredients: [{ name: '五花肉', amount: '600g' }, { name: '黄酒', amount: '200ml' }, { name: '生抽', amount: '4勺' }, { name: '冰糖', amount: '30g' }], method: 'braise', nutritionAnalysis: '胶原丰富，适合少量享用，搭配青菜更均衡。' },
  { id: 84, title: '葱爆羊肉', quote: '北方快手硬菜，靠大火和葱香撑起风味。', emoji: '🐑', difficulty: '简单', time: 15, tags: ['炒菜', '羊肉', '快手'], ingredients: [{ name: '羊肉片', amount: '250g' }, { name: '大葱', amount: '2根' }, { name: '孜然粉', amount: '半勺' }, { name: '生抽', amount: '2勺' }], method: 'stir', nutritionAnalysis: '羊肉富含铁和优质蛋白，葱能减轻膻味。' },
  { id: 85, title: '孜然羊肉', quote: '夜市香气的家庭版，孜然要最后放才香。', emoji: '🐑', difficulty: '简单', time: 18, tags: ['炒菜', '羊肉', '香辣'], ingredients: [{ name: '羊肉片', amount: '300g' }, { name: '洋葱', amount: '半个' }, { name: '孜然粒', amount: '1勺' }, { name: '辣椒粉', amount: '1勺' }], method: 'stir', nutritionAnalysis: '高蛋白高铁，辛香料促进食欲，适合配米饭。' },
  { id: 86, title: '水煮肉片', quote: '川菜的热烈感，一碗红油里藏着鲜嫩肉片。', emoji: '🌶️', difficulty: '中等', time: 35, tags: ['川菜', '猪肉', '香辣'], ingredients: [{ name: '猪里脊', amount: '300g' }, { name: '豆芽', amount: '200g' }, { name: '郫县豆瓣酱', amount: '2勺' }, { name: '花椒', amount: '1勺' }], method: 'stir', nutritionAnalysis: '肉片蛋白质丰富，辣油偏多，建议搭配清淡蔬菜。' },
  { id: 87, title: '酸菜鱼', quote: '酸菜的发酵酸香，是鱼肉鲜甜最好的衬托。', emoji: '🐟', difficulty: '中等', time: 40, tags: ['鱼类', '川菜', '酸辣'], ingredients: [{ name: '黑鱼片', amount: '400g' }, { name: '酸菜', amount: '200g' }, { name: '泡椒', amount: '4个' }, { name: '蛋清', amount: '1个' }], method: 'soup', nutritionAnalysis: '鱼肉低脂高蛋白，酸菜开胃但钠含量偏高。' },
  { id: 88, title: '香辣蟹', quote: '蟹肉鲜甜，香辣外壳让人忍不住吮指。', emoji: '🦀', difficulty: '复杂', time: 40, tags: ['海鲜', '香辣', '宴客'], ingredients: [{ name: '螃蟹', amount: '2只' }, { name: '干辣椒', amount: '8个' }, { name: '花椒', amount: '1勺' }, { name: '洋葱', amount: '半个' }], method: 'stir', nutritionAnalysis: '蟹肉蛋白质高、脂肪低，香辣做法更适合偶尔享用。' },
  { id: 89, title: '清蒸大闸蟹', quote: '好蟹不重调味，姜醋足以托出鲜甜。', emoji: '🦀', difficulty: '简单', time: 25, tags: ['清蒸', '海鲜', '秋季'], ingredients: [{ name: '大闸蟹', amount: '4只' }, { name: '生姜', amount: '1块' }, { name: '香醋', amount: '3勺' }, { name: '紫苏叶', amount: '可选' }], method: 'steam', nutritionAnalysis: '蟹黄能量较高，蟹肉高蛋白，搭配姜醋更平衡。' },
  { id: 90, title: '葱姜炒蛤蜊', quote: '海鲜快炒的精髓是开口即熟，久炒就老。', emoji: '🐚', difficulty: '简单', time: 15, tags: ['海鲜', '快手', '炒菜'], ingredients: [{ name: '蛤蜊', amount: '500g' }, { name: '小葱', amount: '3根' }, { name: '生姜', amount: '5片' }, { name: '料酒', amount: '2勺' }], method: 'stir', nutritionAnalysis: '蛤蜊富含锌和牛磺酸，低脂高鲜味。' },
  { id: 91, title: '红烧带鱼', quote: '带鱼表面的银脂是鲜味来源，不必刮得过净。', emoji: '🐟', difficulty: '中等', time: 35, tags: ['红烧', '鱼类', '家常'], ingredients: [{ name: '带鱼', amount: '500g' }, { name: '生抽', amount: '3勺' }, { name: '香醋', amount: '1勺' }, { name: '姜片', amount: '5片' }], method: 'braise', nutritionAnalysis: '带鱼富含优质脂肪酸，红烧入味但盐分要控制。' },
  { id: 92, title: '干煎带鱼', quote: '外皮焦香、鱼肉细嫩，是最朴素的海味。', emoji: '🐟', difficulty: '简单', time: 25, tags: ['煎炒', '鱼类', '家常'], ingredients: [{ name: '带鱼', amount: '500g' }, { name: '盐', amount: '适量' }, { name: '料酒', amount: '2勺' }, { name: '淀粉', amount: '2勺' }], method: 'stir', nutritionAnalysis: '带鱼蛋白质丰富，干煎比油炸更清爽。' },
  { id: 93, title: '西湖醋鱼', quote: '杭帮菜名品，酸甜芡汁讲究清亮不厚重。', emoji: '🐟', difficulty: '复杂', time: 30, tags: ['鱼类', '江浙菜', '酸甜'], ingredients: [{ name: '草鱼', amount: '1条' }, { name: '香醋', amount: '4勺' }, { name: '白糖', amount: '2勺' }, { name: '姜末', amount: '1勺' }], method: 'steam', nutritionAnalysis: '鱼肉低脂易消化，醋汁开胃，适合清淡饮食。' },
  { id: 94, title: '鲫鱼豆腐汤', quote: '奶白汤底来自鱼肉蛋白与脂肪的乳化。', emoji: '🍲', difficulty: '中等', time: 35, tags: ['汤类', '鱼类', '豆腐'], ingredients: [{ name: '鲫鱼', amount: '1条' }, { name: '豆腐', amount: '300g' }, { name: '生姜', amount: '5片' }, { name: '葱', amount: '2根' }], method: 'soup', nutritionAnalysis: '鱼肉和豆腐双蛋白，汤味清鲜，老人小孩都适合。' },
  { id: 95, title: '萝卜牛腩汤', quote: '白萝卜解腻，牛腩熬出厚实肉香。', emoji: '🍲', difficulty: '中等', time: 90, tags: ['汤类', '牛肉', '秋冬'], ingredients: [{ name: '牛腩', amount: '500g' }, { name: '白萝卜', amount: '1根' }, { name: '生姜', amount: '5片' }, { name: '白胡椒', amount: '少许' }], method: 'soup', nutritionAnalysis: '牛腩补铁，萝卜含消化酶，汤品暖胃。' },
  { id: 96, title: '莲藕排骨汤', quote: '湖北家常靓汤，粉藕炖到绵糯最动人。', emoji: '🍲', difficulty: '简单', time: 80, tags: ['汤类', '排骨', '湖北菜'], ingredients: [{ name: '猪排骨', amount: '500g' }, { name: '莲藕', amount: '500g' }, { name: '生姜', amount: '4片' }, { name: '葱', amount: '2根' }], method: 'soup', nutritionAnalysis: '莲藕富含膳食纤维，排骨补充蛋白和矿物质。' },
  { id: 97, title: '老鸭汤', quote: '鸭肉性味清润，适合慢炖成一锅清香汤。', emoji: '🦆', difficulty: '中等', time: 120, tags: ['汤类', '鸭肉', '滋补'], ingredients: [{ name: '老鸭', amount: '半只' }, { name: '酸萝卜', amount: '150g' }, { name: '生姜', amount: '5片' }, { name: '料酒', amount: '2勺' }], method: 'soup', nutritionAnalysis: '鸭肉脂肪较低，慢炖后汤味醇厚。' },
  { id: 98, title: '菌菇鸡汤', quote: '菌菇自带鲜味，能把鸡汤熬得很干净。', emoji: '🍄', difficulty: '简单', time: 70, tags: ['汤类', '鸡肉', '菌菇'], ingredients: [{ name: '鸡腿', amount: '2个' }, { name: '香菇', amount: '6朵' }, { name: '蟹味菇', amount: '100g' }, { name: '姜片', amount: '4片' }], method: 'soup', nutritionAnalysis: '鸡肉补蛋白，菌菇含多糖，鲜味足而不油腻。' },
  { id: 99, title: '丝瓜蛋汤', quote: '丝瓜清甜，蛋花柔软，是夏天最轻的汤。', emoji: '🥣', difficulty: '简单', time: 12, tags: ['汤类', '快手', '素食'], ingredients: [{ name: '丝瓜', amount: '1根' }, { name: '鸡蛋', amount: '2个' }, { name: '葱花', amount: '适量' }, { name: '香油', amount: '几滴' }], method: 'soup', nutritionAnalysis: '丝瓜水分高、热量低，鸡蛋补充优质蛋白。' },
  { id: 100, title: '上汤娃娃菜', quote: '简单白菜也能靠高汤变得鲜甜高级。', emoji: '🥬', difficulty: '简单', time: 18, tags: ['汤类', '蔬菜', '家常'], ingredients: [{ name: '娃娃菜', amount: '2颗' }, { name: '皮蛋', amount: '1个' }, { name: '咸蛋黄', amount: '1个' }, { name: '高汤', amount: '500ml' }], method: 'soup', nutritionAnalysis: '娃娃菜低热量，高汤增加鲜味，整体清爽。' },
  { id: 101, title: '蚂蚁上树', quote: '粉丝吸满肉末酱汁，名字生动又下饭。', emoji: '🍜', difficulty: '中等', time: 20, tags: ['川菜', '粉丝', '下饭'], ingredients: [{ name: '粉丝', amount: '2把' }, { name: '猪肉末', amount: '120g' }, { name: '豆瓣酱', amount: '1勺' }, { name: '葱花', amount: '适量' }], method: 'noodle', nutritionAnalysis: '粉丝提供碳水，肉末补蛋白，适合作为主食菜。' },
  { id: 102, title: '热干面', quote: '武汉早餐之王，芝麻酱香气是灵魂。', emoji: '🍜', difficulty: '简单', time: 15, tags: ['主食', '面条', '湖北菜'], ingredients: [{ name: '碱水面', amount: '200g' }, { name: '芝麻酱', amount: '2勺' }, { name: '萝卜丁', amount: '适量' }, { name: '葱花', amount: '适量' }], method: 'noodle', nutritionAnalysis: '芝麻酱提供脂肪和钙，面条补充能量。' },
  { id: 103, title: '重庆小面', quote: '一碗小面，红油、花椒和酱油缺一不可。', emoji: '🍜', difficulty: '简单', time: 15, tags: ['主食', '面条', '川味'], ingredients: [{ name: '细面', amount: '150g' }, { name: '辣椒油', amount: '1勺' }, { name: '花椒粉', amount: '半勺' }, { name: '青菜', amount: '1把' }], method: 'noodle', nutritionAnalysis: '主食能量充足，搭配青菜更平衡。' },
  { id: 104, title: '担担面', quote: '担担面贵在肉臊和麻酱的复合香。', emoji: '🍜', difficulty: '中等', time: 25, tags: ['主食', '面条', '川菜'], ingredients: [{ name: '面条', amount: '200g' }, { name: '猪肉末', amount: '120g' }, { name: '芽菜', amount: '30g' }, { name: '芝麻酱', amount: '1勺' }], method: 'noodle', nutritionAnalysis: '碳水和蛋白搭配，调味较重，适合小份享用。' },
  { id: 105, title: '牛肉河粉', quote: '河粉要滑，牛肉要嫩，火候决定成败。', emoji: '🍜', difficulty: '中等', time: 18, tags: ['主食', '粤菜', '牛肉'], ingredients: [{ name: '河粉', amount: '300g' }, { name: '牛肉片', amount: '150g' }, { name: '豆芽', amount: '100g' }, { name: '生抽', amount: '2勺' }], method: 'noodle', nutritionAnalysis: '牛肉补铁，河粉提供碳水，快炒香气足。' },
  { id: 106, title: '星洲炒米粉', quote: '咖喱粉让米粉有南洋风味，颜色也更明亮。', emoji: '🍜', difficulty: '中等', time: 25, tags: ['主食', '米粉', '快手'], ingredients: [{ name: '米粉', amount: '200g' }, { name: '虾仁', amount: '80g' }, { name: '鸡蛋', amount: '2个' }, { name: '咖喱粉', amount: '1勺' }], method: 'noodle', nutritionAnalysis: '米粉易消化，虾仁和鸡蛋补充蛋白。' },
  { id: 107, title: '海南鸡饭', quote: '鸡油饭香、鸡肉嫩，是东南亚华人餐桌经典。', emoji: '🍚', difficulty: '中等', time: 60, tags: ['主食', '鸡肉', '米饭'], ingredients: [{ name: '鸡腿', amount: '2个' }, { name: '大米', amount: '200g' }, { name: '姜蓉', amount: '1勺' }, { name: '黄瓜', amount: '半根' }], method: 'rice', nutritionAnalysis: '鸡肉和米饭组成完整一餐，黄瓜解腻。' },
  { id: 108, title: '腊味煲仔饭', quote: '锅巴是煲仔饭的灵魂，腊味油香渗进米粒。', emoji: '🍚', difficulty: '中等', time: 45, tags: ['主食', '粤菜', '米饭'], ingredients: [{ name: '大米', amount: '200g' }, { name: '广式腊肠', amount: '2根' }, { name: '青菜', amount: '2棵' }, { name: '煲仔饭酱油', amount: '2勺' }], method: 'rice', nutritionAnalysis: '主食饱腹感强，腊味盐分较高，搭配青菜更好。' },
  { id: 109, title: '咖喱鸡饭', quote: '浓稠咖喱裹住米饭，是孩子也喜欢的温柔香料味。', emoji: '🍛', difficulty: '简单', time: 35, tags: ['主食', '鸡肉', '咖喱'], ingredients: [{ name: '鸡腿肉', amount: '300g' }, { name: '土豆', amount: '1个' }, { name: '胡萝卜', amount: '1根' }, { name: '咖喱块', amount: '2块' }], method: 'braise', nutritionAnalysis: '鸡肉补蛋白，土豆胡萝卜补充碳水和维生素。' },
  { id: 110, title: '亲子丼', quote: '鸡肉和鸡蛋同碗，日式家常最温柔的一面。', emoji: '🍚', difficulty: '简单', time: 20, tags: ['主食', '日式', '鸡蛋'], ingredients: [{ name: '鸡腿肉', amount: '200g' }, { name: '鸡蛋', amount: '2个' }, { name: '洋葱', amount: '半个' }, { name: '米饭', amount: '1碗' }], method: 'rice', nutritionAnalysis: '鸡蛋鸡肉双蛋白，适合快速补充能量。' },
  { id: 111, title: '韩式拌饭', quote: '一碗里有饭、有菜、有蛋，拌开才完整。', emoji: '🍚', difficulty: '简单', time: 25, tags: ['主食', '拌饭', '蔬菜'], ingredients: [{ name: '米饭', amount: '1碗' }, { name: '菠菜', amount: '1把' }, { name: '胡萝卜', amount: '半根' }, { name: '韩式辣酱', amount: '1勺' }], method: 'rice', nutritionAnalysis: '蔬菜丰富，主食和蛋白搭配均衡。' },
  { id: 112, title: '照烧鸡腿饭', quote: '甜咸照烧汁和焦香鸡皮，是米饭杀手。', emoji: '🍗', difficulty: '简单', time: 30, tags: ['主食', '鸡肉', '日式'], ingredients: [{ name: '鸡腿', amount: '2个' }, { name: '米饭', amount: '2碗' }, { name: '生抽', amount: '2勺' }, { name: '蜂蜜', amount: '1勺' }], method: 'braise', nutritionAnalysis: '鸡腿蛋白丰富，照烧汁含糖，适量即可。' },
  { id: 113, title: '韭菜盒子', quote: '外皮焦香、韭菜鲜香，是北方早晚餐常客。', emoji: '🥟', difficulty: '中等', time: 45, tags: ['主食', '煎饼', '北方菜'], ingredients: [{ name: '韭菜', amount: '300g' }, { name: '鸡蛋', amount: '3个' }, { name: '面粉', amount: '300g' }, { name: '虾皮', amount: '20g' }], method: 'dumpling', nutritionAnalysis: '韭菜含膳食纤维，鸡蛋补蛋白，饱腹感强。' },
  { id: 114, title: '牛肉馅饼', quote: '咬开爆汁，靠的是肉馅打水和小火慢煎。', emoji: '🥟', difficulty: '中等', time: 50, tags: ['主食', '牛肉', '北方菜'], ingredients: [{ name: '牛肉末', amount: '300g' }, { name: '洋葱', amount: '半个' }, { name: '面粉', amount: '300g' }, { name: '生抽', amount: '2勺' }], method: 'dumpling', nutritionAnalysis: '牛肉铁含量高，作为主食很扎实。' },
  { id: 115, title: '萝卜丝饼', quote: '萝卜清甜，煎到两面金黄才有香气。', emoji: '🥞', difficulty: '简单', time: 25, tags: ['主食', '早餐', '素食'], ingredients: [{ name: '白萝卜', amount: '300g' }, { name: '面粉', amount: '120g' }, { name: '鸡蛋', amount: '1个' }, { name: '葱花', amount: '适量' }], method: 'breakfast', nutritionAnalysis: '萝卜低热量，面粉和鸡蛋提供能量与蛋白。' },
  { id: 116, title: '葱花鸡蛋饼', quote: '十分钟早餐，香的是葱花和热锅。', emoji: '🥞', difficulty: '简单', time: 12, tags: ['早餐', '快手', '鸡蛋'], ingredients: [{ name: '鸡蛋', amount: '2个' }, { name: '面粉', amount: '80g' }, { name: '葱花', amount: '适量' }, { name: '清水', amount: '120ml' }], method: 'breakfast', nutritionAnalysis: '鸡蛋补蛋白，面糊提供碳水，早餐能量稳定。' },
  { id: 117, title: '酒酿圆子', quote: '江南甜汤，酒酿香气轻柔不腻。', emoji: '🍡', difficulty: '简单', time: 15, tags: ['甜品', '早餐', '江南'], ingredients: [{ name: '小圆子', amount: '200g' }, { name: '酒酿', amount: '150g' }, { name: '鸡蛋', amount: '1个' }, { name: '枸杞', amount: '少许' }], method: 'breakfast', nutritionAnalysis: '糯米提供能量，甜度可控，适合作为小甜汤。' },
  { id: 118, title: '红豆粥', quote: '红豆慢熬出沙，米香和豆香融合。', emoji: '🥣', difficulty: '简单', time: 60, tags: ['粥类', '早餐', '养生'], ingredients: [{ name: '红豆', amount: '80g' }, { name: '大米', amount: '60g' }, { name: '冰糖', amount: '少许' }, { name: '清水', amount: '1L' }], method: 'breakfast', nutritionAnalysis: '红豆富含膳食纤维和钾，粥品温和易消化。' },
  { id: 119, title: '南瓜粥', quote: '南瓜自带甜味，不加糖也柔和。', emoji: '🥣', difficulty: '简单', time: 35, tags: ['粥类', '早餐', '养胃'], ingredients: [{ name: '南瓜', amount: '300g' }, { name: '大米', amount: '80g' }, { name: '清水', amount: '900ml' }, { name: '枸杞', amount: '少许' }], method: 'breakfast', nutritionAnalysis: '南瓜含 β-胡萝卜素，粥品清甜低负担。' },
  { id: 120, title: '蒸南瓜', quote: '最简单的做法，最能吃出南瓜本味。', emoji: '🎃', difficulty: '简单', time: 20, tags: ['清蒸', '素食', '早餐'], ingredients: [{ name: '南瓜', amount: '400g' }, { name: '清水', amount: '适量' }, { name: '蜂蜜', amount: '可选' }, { name: '芝麻', amount: '少许' }], method: 'steam', nutritionAnalysis: '南瓜热量适中，富含胡萝卜素和膳食纤维。' },
  { id: 121, title: '清炒油麦菜', quote: '油麦菜清香，蒜蓉一爆就足够好吃。', emoji: '🥬', difficulty: '简单', time: 10, tags: ['炒菜', '素食', '快手'], ingredients: [{ name: '油麦菜', amount: '300g' }, { name: '大蒜', amount: '4瓣' }, { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }], method: 'stir', nutritionAnalysis: '绿叶菜膳食纤维丰富，低热量，适合每日搭配。' },
  { id: 122, title: '清炒空心菜', quote: '大火快炒，空心菜才会翠绿爽脆。', emoji: '🥬', difficulty: '简单', time: 10, tags: ['炒菜', '素食', '快手'], ingredients: [{ name: '空心菜', amount: '350g' }, { name: '蒜末', amount: '1勺' }, { name: '腐乳', amount: '半块可选' }, { name: '盐', amount: '适量' }], method: 'stir', nutritionAnalysis: '空心菜钾和纤维丰富，快炒能保留脆感。' },
  { id: 123, title: '香菇青菜', quote: '香菇鲜、青菜甜，是最稳的素菜组合。', emoji: '🍄', difficulty: '简单', time: 15, tags: ['炒菜', '素食', '家常'], ingredients: [{ name: '青菜', amount: '300g' }, { name: '香菇', amount: '6朵' }, { name: '蚝油', amount: '1勺' }, { name: '大蒜', amount: '3瓣' }], method: 'stir', nutritionAnalysis: '香菇含多糖，青菜补充维生素和膳食纤维。' },
  { id: 124, title: '蚝油生菜', quote: '生菜焯到刚软，蚝油汁一淋就成菜。', emoji: '🥬', difficulty: '简单', time: 8, tags: ['素食', '快手', '粤菜'], ingredients: [{ name: '生菜', amount: '2颗' }, { name: '蚝油', amount: '2勺' }, { name: '蒜末', amount: '1勺' }, { name: '生抽', amount: '1勺' }], method: 'stir', nutritionAnalysis: '生菜热量低，蚝油提鲜，适合清爽配菜。' },
  { id: 125, title: '虎皮青椒', quote: '青椒煎出虎皮纹，酸香酱汁才挂得住。', emoji: '🫑', difficulty: '简单', time: 15, tags: ['炒菜', '素食', '下饭'], ingredients: [{ name: '青椒', amount: '6个' }, { name: '蒜末', amount: '1勺' }, { name: '生抽', amount: '2勺' }, { name: '香醋', amount: '1勺' }], method: 'stir', nutritionAnalysis: '青椒维生素 C 丰富，少油煎制更清爽。' },
  { id: 126, title: '鱼香茄子', quote: '没有鱼也有鱼香，靠的是酸甜辣咸的平衡。', emoji: '🍆', difficulty: '中等', time: 25, tags: ['川菜', '茄子', '下饭'], ingredients: [{ name: '茄子', amount: '2根' }, { name: '猪肉末', amount: '80g' }, { name: '豆瓣酱', amount: '1勺' }, { name: '香醋', amount: '1勺' }], method: 'stir', nutritionAnalysis: '茄子吸汁，肉末增香，注意控油更健康。' },
  { id: 127, title: '肉末茄子', quote: '肉末和茄子天生互补，酱汁要收得浓。', emoji: '🍆', difficulty: '简单', time: 20, tags: ['炒菜', '茄子', '下饭'], ingredients: [{ name: '茄子', amount: '2根' }, { name: '猪肉末', amount: '120g' }, { name: '生抽', amount: '2勺' }, { name: '蒜末', amount: '1勺' }], method: 'stir', nutritionAnalysis: '茄子含花青素，肉末补充蛋白，下饭但需控油。' },
  { id: 128, title: '番茄土豆炖牛肉', quote: '番茄酸香、土豆绵软，牛肉汤汁最适合拌饭。', emoji: '🍅', difficulty: '中等', time: 80, tags: ['炖煮', '牛肉', '番茄'], ingredients: [{ name: '牛肉', amount: '500g' }, { name: '番茄', amount: '3个' }, { name: '土豆', amount: '2个' }, { name: '洋葱', amount: '半个' }], method: 'braise', nutritionAnalysis: '牛肉补铁，番茄维 C 促进铁吸收，营养互补。' },
  { id: 129, title: '咖喱牛腩', quote: '牛腩软烂，咖喱浓稠，是一锅解决主菜的做法。', emoji: '🍛', difficulty: '中等', time: 90, tags: ['炖煮', '牛肉', '咖喱'], ingredients: [{ name: '牛腩', amount: '500g' }, { name: '咖喱块', amount: '3块' }, { name: '土豆', amount: '1个' }, { name: '胡萝卜', amount: '1根' }], method: 'braise', nutritionAnalysis: '牛腩蛋白丰富，咖喱能量较高，适合配饭。' },
  { id: 130, title: '黑椒牛柳', quote: '黑椒辛香配嫩牛肉，是家庭版西餐快炒。', emoji: '🥩', difficulty: '中等', time: 20, tags: ['炒菜', '牛肉', '黑椒'], ingredients: [{ name: '牛里脊', amount: '300g' }, { name: '洋葱', amount: '半个' }, { name: '黑椒汁', amount: '2勺' }, { name: '彩椒', amount: '1个' }], method: 'stir', nutritionAnalysis: '牛肉含血红素铁，彩椒补充维生素 C。' },
  { id: 131, title: '芹菜炒牛肉', quote: '芹菜清香去腻，牛肉滑嫩才好吃。', emoji: '🥩', difficulty: '简单', time: 18, tags: ['炒菜', '牛肉', '快手'], ingredients: [{ name: '牛肉', amount: '250g' }, { name: '芹菜', amount: '200g' }, { name: '生抽', amount: '2勺' }, { name: '淀粉', amount: '1勺' }], method: 'stir', nutritionAnalysis: '芹菜纤维丰富，牛肉补铁，快炒更保留口感。' },
  { id: 132, title: '西葫芦炒鸡蛋', quote: '清甜西葫芦配嫩蛋，是厨房新手友好菜。', emoji: '🥚', difficulty: '简单', time: 12, tags: ['炒菜', '鸡蛋', '快手'], ingredients: [{ name: '西葫芦', amount: '1根' }, { name: '鸡蛋', amount: '3个' }, { name: '葱花', amount: '适量' }, { name: '盐', amount: '适量' }], method: 'stir', nutritionAnalysis: '鸡蛋补蛋白，西葫芦低热量，适合日常。' },
  { id: 133, title: '韭菜炒鸡蛋', quote: '韭菜香气强，鸡蛋要嫩才不抢味。', emoji: '🥚', difficulty: '简单', time: 10, tags: ['炒菜', '鸡蛋', '快手'], ingredients: [{ name: '韭菜', amount: '200g' }, { name: '鸡蛋', amount: '3个' }, { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }], method: 'stir', nutritionAnalysis: '韭菜含硫化物，鸡蛋提供优质蛋白。' },
  { id: 134, title: '苦瓜炒蛋', quote: '苦瓜先盐腌，苦味会柔和很多。', emoji: '🥚', difficulty: '简单', time: 15, tags: ['炒菜', '鸡蛋', '蔬菜'], ingredients: [{ name: '苦瓜', amount: '1根' }, { name: '鸡蛋', amount: '3个' }, { name: '盐', amount: '适量' }, { name: '蒜末', amount: '可选' }], method: 'stir', nutritionAnalysis: '苦瓜热量低，鸡蛋补蛋白，清爽不腻。' },
  { id: 135, title: '虾仁炒蛋', quote: '虾仁鲜甜，蛋液滑嫩，是高蛋白快手菜。', emoji: '🍤', difficulty: '简单', time: 12, tags: ['炒菜', '虾仁', '鸡蛋'], ingredients: [{ name: '虾仁', amount: '150g' }, { name: '鸡蛋', amount: '3个' }, { name: '葱花', amount: '适量' }, { name: '料酒', amount: '1勺' }], method: 'stir', nutritionAnalysis: '虾仁低脂高蛋白，鸡蛋营养完整。' },
  { id: 136, title: '赛螃蟹', quote: '没有蟹也有蟹味，姜醋和鸡蛋最关键。', emoji: '🥚', difficulty: '中等', time: 15, tags: ['鸡蛋', '家常', '快手'], ingredients: [{ name: '鸡蛋', amount: '4个' }, { name: '姜末', amount: '1勺' }, { name: '香醋', amount: '2勺' }, { name: '白糖', amount: '半勺' }], method: 'stir', nutritionAnalysis: '鸡蛋提供完全蛋白，姜醋提味解腻。' },
  { id: 137, title: '蒜香鸡翅', quote: '蒜香深入鸡皮，煎到金黄最诱人。', emoji: '🍗', difficulty: '简单', time: 30, tags: ['鸡翅', '煎炒', '家常'], ingredients: [{ name: '鸡翅中', amount: '500g' }, { name: '大蒜', amount: '8瓣' }, { name: '生抽', amount: '2勺' }, { name: '蜂蜜', amount: '1勺' }], method: 'stir', nutritionAnalysis: '鸡翅蛋白丰富，蒜香开胃，注意控制油量。' },
  { id: 138, title: '辣子鸡', quote: '干辣椒里找鸡丁，是川菜的快乐。', emoji: '🌶️', difficulty: '中等', time: 35, tags: ['川菜', '鸡肉', '香辣'], ingredients: [{ name: '鸡腿肉', amount: '500g' }, { name: '干辣椒', amount: '一大把' }, { name: '花椒', amount: '1勺' }, { name: '白芝麻', amount: '适量' }], method: 'stir', nutritionAnalysis: '鸡肉高蛋白，辣味重，适合搭配清淡汤菜。' },
  { id: 139, title: '大盘鸡', quote: '新疆风味一锅炖，土豆和宽面都吸满汤汁。', emoji: '🍗', difficulty: '中等', time: 50, tags: ['炖煮', '鸡肉', '新疆菜'], ingredients: [{ name: '鸡腿', amount: '2个' }, { name: '土豆', amount: '2个' }, { name: '青椒', amount: '2个' }, { name: '宽面', amount: '200g' }], method: 'braise', nutritionAnalysis: '鸡肉土豆提供蛋白和碳水，适合作为完整一餐。' },
  { id: 140, title: '白切鸡', quote: '皮爽肉滑，靠浸熟而不是猛煮。', emoji: '🐔', difficulty: '中等', time: 50, tags: ['粤菜', '鸡肉', '冷盘'], ingredients: [{ name: '三黄鸡', amount: '半只' }, { name: '姜葱', amount: '适量' }, { name: '沙姜粉', amount: '可选' }, { name: '生抽', amount: '2勺' }], method: 'steam', nutritionAnalysis: '白切保留鸡肉原味，油脂少于红烧炸制。' },
  { id: 141, title: '盐焗鸡', quote: '盐焗香气浓郁，家庭版用盐焗粉更稳定。', emoji: '🐔', difficulty: '中等', time: 60, tags: ['鸡肉', '粤菜', '烤焗'], ingredients: [{ name: '整鸡', amount: '半只' }, { name: '盐焗粉', amount: '1包' }, { name: '姜片', amount: '5片' }, { name: '葱', amount: '2根' }], method: 'steam', nutritionAnalysis: '鸡肉优质蛋白，盐焗风味浓，注意控制咸度。' },
  { id: 142, title: '手撕鸡', quote: '鸡肉撕开更入味，凉拌汁要香而不腻。', emoji: '🐔', difficulty: '简单', time: 35, tags: ['凉菜', '鸡肉', '家常'], ingredients: [{ name: '鸡腿', amount: '2个' }, { name: '黄瓜', amount: '半根' }, { name: '香菜', amount: '适量' }, { name: '辣椒油', amount: '1勺' }], method: 'cold', nutritionAnalysis: '鸡腿肉蛋白充足，凉拌方式清爽开胃。' },
  { id: 143, title: '凉拌鸡丝', quote: '鸡胸肉不柴的关键，是煮好后顺纹撕丝。', emoji: '🐔', difficulty: '简单', time: 25, tags: ['凉菜', '鸡胸肉', '减脂'], ingredients: [{ name: '鸡胸肉', amount: '250g' }, { name: '黄瓜', amount: '1根' }, { name: '胡萝卜', amount: '半根' }, { name: '生抽', amount: '2勺' }], method: 'cold', nutritionAnalysis: '高蛋白低脂肪，适合减脂或清爽晚餐。' },
  { id: 144, title: '口水鸡', quote: '红油、花椒、鸡肉，麻辣鲜香一口到位。', emoji: '🌶️', difficulty: '中等', time: 40, tags: ['凉菜', '川菜', '鸡肉'], ingredients: [{ name: '鸡腿', amount: '2个' }, { name: '辣椒油', amount: '3勺' }, { name: '花椒粉', amount: '半勺' }, { name: '花生碎', amount: '适量' }], method: 'cold', nutritionAnalysis: '鸡肉蛋白充足，红油较多，适合少量开胃。' },
  { id: 145, title: '凉拌海带丝', quote: '海带爽脆，蒜醋一拌就是夏日小菜。', emoji: '🌊', difficulty: '简单', time: 12, tags: ['凉菜', '素食', '快手'], ingredients: [{ name: '海带丝', amount: '250g' }, { name: '蒜末', amount: '1勺' }, { name: '香醋', amount: '2勺' }, { name: '辣椒油', amount: '可选' }], method: 'cold', nutritionAnalysis: '海带富含碘和膳食纤维，热量很低。' },
  { id: 146, title: '凉拌藕片', quote: '藕片脆爽，酸辣汁最能突出清甜。', emoji: '🪷', difficulty: '简单', time: 15, tags: ['凉菜', '素食', '快手'], ingredients: [{ name: '莲藕', amount: '1节' }, { name: '香醋', amount: '2勺' }, { name: '小米辣', amount: '2个' }, { name: '蒜末', amount: '1勺' }], method: 'cold', nutritionAnalysis: '莲藕含淀粉和纤维，凉拌清爽开胃。' },
  { id: 147, title: '蒜泥茄子', quote: '蒸软的茄子吸满蒜香，是不油腻的茄子做法。', emoji: '🍆', difficulty: '简单', time: 20, tags: ['凉菜', '素食', '蒸菜'], ingredients: [{ name: '茄子', amount: '2根' }, { name: '大蒜', amount: '6瓣' }, { name: '生抽', amount: '2勺' }, { name: '香油', amount: '1勺' }], method: 'steam', nutritionAnalysis: '蒸茄子比油炒更低脂，蒜香开胃。' },
  { id: 148, title: '麻酱油麦菜', quote: '芝麻酱一拌，清爽青菜也有浓郁满足感。', emoji: '🥬', difficulty: '简单', time: 10, tags: ['凉菜', '素食', '快手'], ingredients: [{ name: '油麦菜', amount: '300g' }, { name: '芝麻酱', amount: '2勺' }, { name: '生抽', amount: '1勺' }, { name: '香醋', amount: '半勺' }], method: 'cold', nutritionAnalysis: '油麦菜低热量，芝麻酱补钙但热量较高。' },
  { id: 149, title: '小葱拌豆腐', quote: '一清二白，是最朴素也最考验豆腐品质的凉菜。', emoji: '🧈', difficulty: '简单', time: 5, tags: ['凉菜', '豆腐', '快手'], ingredients: [{ name: '嫩豆腐', amount: '1盒' }, { name: '小葱', amount: '2根' }, { name: '生抽', amount: '1勺' }, { name: '香油', amount: '半勺' }], method: 'cold', nutritionAnalysis: '豆腐植物蛋白和钙丰富，热量低。' },
  { id: 150, title: '红烧豆腐', quote: '豆腐煎到定型再烧，才会外香内嫩。', emoji: '🧈', difficulty: '简单', time: 20, tags: ['红烧', '豆腐', '素食'], ingredients: [{ name: '老豆腐', amount: '400g' }, { name: '生抽', amount: '2勺' }, { name: '蚝油', amount: '1勺' }, { name: '蒜末', amount: '1勺' }], method: 'braise', nutritionAnalysis: '豆腐提供植物蛋白，红烧做法下饭但不厚重。' },
]

export const ADDITIONAL_RECIPES: Recipe[] = SEEDS.map((seed) => ({
  id: seed.id,
  title: seed.title,
  quote: seed.quote,
  rating: 4.5 + ((seed.id % 5) / 10),
  count: 900 + seed.id * 31,
  emoji: seed.emoji,
  difficulty: seed.difficulty,
  time: seed.time,
  tags: seed.tags,
  ingredients: seed.ingredients,
  steps: METHOD_STEPS[seed.method](seed),
  nutritionAnalysis: seed.nutritionAnalysis,
}))
