// The little Buddha by the pagoda, at the top of the page: touch him and he offers one of these, at random.
// 66 in all: forty classic lines in five themes, said in plain everyday English (the closer, more literal translation
// is kept as enLit), and 26 sayings that are plain already — from the Dhammapada, the Zen masters and a few modern
// teachers. zh: the line in Chinese (for the 26, the classical Chinese where there is one — the Dhammapada's old
// translation, the Zen masters' own words — otherwise a plain modern rendering); en: what is shown; src: its source.
export interface Teaching { theme: string; zh: string; en: string; src: string; enLit?: string }

const T = (theme: string, list: [string, string, string, string?][]): Teaching[] => list.map(([zh, en, src, enLit]) => ({ theme, zh, en, src, enLit }));

export const TEACHINGS: Teaching[] = [
  ...T('无常 · Impermanence', [
    ['一切有为法，如梦幻泡影，如露亦如电，应作如是观。', 'Everything that comes together comes apart — like a dream, a bubble, dew, a flash of lightning.', '《金刚经》 Diamond Sutra', 'All conditioned things are like dreams, illusions, bubbles, and shadows; like dew and lightning, they arise and pass away.'],
    ['凡所有相，皆是虚妄。', 'What you see is never the whole story.', '《金刚经》 Diamond Sutra', 'All appearances are ultimately illusory.'],
    ['诸行无常，是生灭法。', 'Everything changes. Things begin, and things end.', '《大般涅槃经》 Mahāparinirvāṇa Sūtra', 'All conditioned things are impermanent, subject to arising and ceasing.'],
    ['生灭灭已，寂灭为乐。', 'When the rush of beginnings and endings goes quiet, there is peace.', '《大般涅槃经》 Mahāparinirvāṇa Sūtra', 'When arising and ceasing come to rest, there is the peace of nirvana.'],
    ['过去心不可得，现在心不可得，未来心不可得。', 'You can’t hold on to yesterday, today, or tomorrow.', '《金刚经》 Diamond Sutra', 'The past mind cannot be grasped, the present mind cannot be grasped, and the future mind cannot be grasped.'],
    ['一切行无常。', 'Nothing stays the same.', '《法句经》 Dhammapada（对应巴利经典偈义）', 'All conditioned things are impermanent.'],
    ['如梦幻泡影，如露亦如电。', 'Like a dream, a bubble, a shadow; like dew, like lightning.', '《金刚经》 Diamond Sutra，节录', 'Like a dream, an illusion, a bubble, a shadow; like dew and lightning.'],
    ['诸法因缘生，诸法因缘灭。', 'Everything happens because of something else — and fades when that is gone.', '缘起偈传统汉译表述', 'All things arise through causes and conditions, and cease when those conditions dissolve.'],
  ]),
  ...T('放下 · Letting Go', [
    ['应无所住，而生其心。', 'Don’t get stuck anywhere. Let your mind move freely.', '《金刚经》 Diamond Sutra', 'Let the mind arise without dwelling anywhere.'],
    ['若见诸相非相，即见如来。', 'See past the surface, and you see what’s true.', '《金刚经》 Diamond Sutra', 'To see appearances as non-appearances is to see the Tathagata.'],
    ['法尚应舍，何况非法。', 'Even good advice is a raft — leave it on the shore once you’ve crossed.', '《金刚经》 Diamond Sutra', 'Even the teachings must be let go of, much less what is not the teaching.'],
    ['不取于相，如如不动。', 'Don’t chase appearances. Stay steady.', '《金刚经》 Diamond Sutra', 'Do not cling to appearances; remain still and undisturbed.'],
    ['若心有住，即为非住。', 'Holding on too tight is how you lose your footing.', '《金刚经》 Diamond Sutra', 'When the mind clings to something, it does not truly abide.'],
    ['离一切诸相，即名诸佛。', 'Let go of every label, and you’re free.', '《金刚经》 Diamond Sutra', 'To be free from all appearances is to be called a Buddha.'],
    ['无所从来，亦无所去。', 'Coming from nowhere, going nowhere.', '《金刚经》 Diamond Sutra，节录', 'Coming from nowhere, going nowhere.'],
    ['本来无一物，何处惹尘埃。', 'Nothing is there to begin with. Where would the dust land?', '《六祖坛经》 Platform Sutra', 'Originally, there is not a single thing. Where could dust possibly settle?'],
  ]),
  ...T('自在 · Inner Freedom', [
    ['色即是空，空即是色。', 'What looks solid is empty; what looks empty is full.', '《心经》 Heart Sutra', 'Form is emptiness, and emptiness is form.'],
    ['心无挂碍，无挂碍故，无有恐怖。', 'When nothing weighs on your heart, there’s nothing to fear.', '《心经》 Heart Sutra', 'With nothing obstructing the mind, there is no fear.'],
    ['远离颠倒梦想，究竟涅槃。', 'Let go of the stories that twist things, and you’ll find peace.', '《心经》 Heart Sutra', 'Free from delusion and distorted perception, one reaches ultimate nirvana.'],
    ['不生不灭，不垢不净，不增不减。', 'Nothing truly begins or ends, gets dirty or clean, grows or shrinks.', '《心经》 Heart Sutra', 'Neither arising nor ceasing, neither defiled nor pure, neither increasing nor decreasing.'],
    ['心净则佛土净。', 'A clear mind makes a clear world.', '《维摩诘经》 Vimalakīrti Sūtra，节录', 'When the mind is pure, the Buddha-land is pure.'],
    ['随其心净，则佛土净。', 'As your heart gets lighter, the world around you does too.', '《维摩诘经》 Vimalakīrti Sūtra', 'As the mind becomes pure, so does the Buddha-land.'],
    ['于诸境上心不染，曰无念。', 'Meet whatever happens without getting tangled in it.', '《六祖坛经》 Platform Sutra', 'To encounter all circumstances without the mind becoming attached is called no-thought.'],
    ['外离相为禅，内不乱为定。', 'Outside, don’t be ruled by appearances. Inside, stay calm.', '《六祖坛经》 Platform Sutra', 'Freedom from appearances is meditation; inner stillness is concentration.'],
  ]),
  ...T('智慧 · Wisdom', [
    ['若以色见我，以音声求我，是人行邪道，不能见如来。', 'What’s real can’t be found only in how things look or sound.', '《金刚经》 Diamond Sutra', 'Those who seek me through form or sound cannot truly perceive the Tathagata.'],
    ['一切众生，皆有佛性。', 'Everyone has something awake inside them.', '《大般涅槃经》 Mahāparinirvāṇa Sūtra，经义常见表述', 'All sentient beings possess Buddha-nature.'],
    ['不识本心，学法无益。', 'If you don’t know your own heart, no book will help.', '《六祖坛经》 Platform Sutra', 'Without knowing your original mind, studying the Dharma brings little benefit.'],
    ['菩提自性，本来清净。', 'Your true nature is already clear.', '《六祖坛经》 Platform Sutra', 'The nature of enlightenment is originally pure.'],
    ['迷时师度，悟了自度。', 'Others can show you the way. Only you can walk it.', '《六祖坛经》 Platform Sutra', 'When lost, a teacher guides you; when awakened, you guide yourself.'],
    ['一切唯心造。', 'How you see it shapes what it becomes.', '《华严经》 Avataṃsaka Sūtra，节录', 'All is shaped by the mind.'],
    ['若人欲了知，三世一切佛，应观法界性，一切唯心造。', 'Want to understand every Buddha, past and future? Look closely: the mind makes everything.', '《华严经》 Avataṃsaka Sūtra', 'To understand the Buddhas of past, present, and future, contemplate the nature of reality: all is shaped by mind.'],
    ['自性若悟，众生是佛。', 'Wake up to who you really are, and you’re already a Buddha.', '《六祖坛经》 Platform Sutra，节录', 'When one’s true nature is awakened, an ordinary being is a Buddha.'],
  ]),
  ...T('慈悲 · Compassion', [
    ['应如是生清净心。', 'Let your heart be clear.', '《金刚经》 Diamond Sutra', 'Thus should a pure mind arise.'],
    ['应生无所住心。', 'Love without clinging.', '《金刚经》 Diamond Sutra', 'Let the mind arise without attachment.'],
    ['所有一切众生之类，我皆令入无余涅槃而灭度之。', 'Help everyone find their way to peace.', '《金刚经》 Diamond Sutra，节录', 'I vow to guide all sentient beings toward complete liberation.'],
    ['实无众生得灭度者。', 'And don’t keep score of whom you’ve helped.', '《金刚经》 Diamond Sutra，节录', 'Yet ultimately, no being is grasped as having been liberated.'],
    ['于一切法，应如是知，如是见，如是信解，不生法相。', 'See things as they are, without boxing them in.', '《金刚经》 Diamond Sutra', 'Know, see, and understand all things without clinging to fixed concepts.'],
    ['若菩萨有我相、人相、众生相、寿者相，即非菩萨。', 'Drop “me” and “them,” and you’re on the way.', '《金刚经》 Diamond Sutra', 'One who clings to the notions of self, person, being, or lifespan is not truly a bodhisattva.'],
    ['能善分别诸法相，于第一义而不动。', 'Notice every difference, and stay steady inside.', '《维摩诘经》 Vimalakīrti Sūtra', 'To discern the distinctions of all things while remaining unmoved in ultimate truth.'],
    ['一切众生，悉皆平等。', 'Every being is equal.', '佛教平等观的概括，非特定经文逐字引句', 'All sentient beings are equal.'],
  ]),
  ...T('浅白 · Plain words', [
    ['以怨止怨，终不能止；唯有慈心，能止怨恨。', 'Hatred never ends through hatred. Only love can heal it.', 'Dhammapada 5'],
    ['虽诵千言，句义不正，不如一要，闻可灭意。', 'Better than a thousand empty words is one word that brings peace.', 'Dhammapada 100'],
    ['滴水虽微，渐盈大器。', 'Drop by drop, the water pot is filled.', 'Dhammapada 122'],
    ['无病最利，知足最富。', 'Health is the greatest gift. Contentment is the greatest wealth.', 'Dhammapada 204'],
    ['心为法本，中心念善，即言即行，福乐自追，如影随形。', 'Speak and act with a kind heart, and happiness follows you like your own shadow.', 'Dhammapada 2'],
    ['千千为敌，一夫胜之，未若自胜，为战中上。', 'Winning a thousand battles is less than winning over yourself.', 'Dhammapada 103'],
    ['忍辱胜恚，善胜不善，胜者能施，至诚胜欺。', 'Meet anger with kindness, greed with generosity, lies with the truth.', 'Dhammapada 223'],
    ['譬如厚石，风不能移，智者意重，毁誉不倾。', 'Like a rock in the wind, a wise heart isn’t moved by praise or blame.', 'Dhammapada 81'],
    ['不观他人过，不观作不作，但自观身行，作与不作者。', 'Don’t look for what others did wrong. Look at what you’ve done yourself.', 'Dhammapada 50'],
    ['人皆不知，我等将死；若能知此，诤论自息。', 'We forget we won’t be here forever. Remember, and quarrels fade.', 'Dhammapada 6'],
    ['自己是自己的依靠，他人怎能是依靠？', 'You are your own home. Who else could be?', 'Dhammapada 160'],
    ['汝当自努力，如来唯说道。', 'You have to walk it yourself. A teacher can only point the way.', 'Dhammapada 276'],
    ['诸恶莫作，众善奉行，自净其意，是诸佛教。', 'Do no harm. Do good. Keep your heart clear. That’s all of it.', 'Dhammapada 183'],
    ['心难调伏，调伏则乐。', 'A restless mind is hard to tame. A calm one brings joy.', 'Dhammapada 35'],
    ['如母护独子，不惜其身命，于一切众生，修无量慈心。', 'Love all beings the way a mother loves her only child.', 'Metta Sutta'],
    ['日日是好日。', 'Every day is a good day.', 'Yunmen'],
    ['饥来吃饭，困来即眠。', 'When hungry, eat. When tired, sleep.', 'Dazhu Huihai'],
    ['不知最亲切。', 'Not knowing is the closest.', 'Dizang'],
    ['平常心是道。', 'Your everyday mind is the way.', 'Mazu'],
    ['吃茶去。', 'Go have some tea.', 'Zhaozhou'],
    ['春有百花秋有月，夏有凉风冬有雪；若无闲事挂心头，便是人间好时节。', 'Flowers in spring, the moon in autumn, cool wind in summer, snow in winter. With nothing needless on your mind, every season is a good one.', 'Wumen Huikai'],
    ['神通并妙用，运水及搬柴。', 'My magic powers: carrying water, chopping wood.', 'Layman Pang'],
    ['初心者，可能性无限；行家心中，可能性寥寥。', 'In the beginner’s mind there are many possibilities. In the expert’s, few.', 'Shunryu Suzuki, Zen Mind, Beginner’s Mind'],
    ['行走时，如同以双足亲吻大地。', 'Walk as if you are kissing the earth with your feet.', 'Thich Nhat Hanh'],
    ['微笑，呼吸，慢慢走。', 'Smile, breathe, and go slowly.', 'Thich Nhat Hanh'],
    ['放下一点，就有一点平静；放下很多，就有很多平静。', 'Let go a little, and you’ll have a little peace. Let go a lot, and you’ll have a lot.', 'Ajahn Chah'],
  ]),
];
/** the source in English only (the Chinese titles and notes in `src` turned into English) */
export function sourceEn(src: string): string {
  const special: Record<string, string> = {
    '缘起偈传统汉译表述': 'Verse of Dependent Origination',
    '佛教平等观的概括，非特定经文逐字引句': 'On the equality of all beings',
  };
  if (special[src]) return special[src];
  return src
    .replace(/《[^》]*》\s*/g, '')                       // the Chinese title
    .replace(/，[^，]*$|（[^）]*）$/, '')                // notes like 节录 (excerpt) are left out: just the source
    .trim();
}
