import type { Recipe } from '../types/recipe'
import { SEEDS, type RecipeSeed } from './additionalSeeds'

type Method = RecipeSeed['method']

const METHOD_STEPS: Record<Method, (seed: RecipeSeed) => NonNullable<Recipe['steps']>> = {
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
