import { Badge } from "@/components/ui/badge"

export const sections = [
  {
    id: 'hero',
    subtitle: <Badge variant="outline" className="text-white border-white/50">Бросьте вызов ИИ</Badge>,
    title: "Шахматы против искусственного интеллекта.",
    showButton: true,
    buttonText: 'Играть сейчас'
  },
  {
    id: 'about',
    title: 'Умный противник.',
    content: 'ИИ анализирует каждый ваш ход и отвечает оптимальной стратегией. Подходит для новичков и опытных игроков — уровень сложности адаптируется под вас.'
  },
  {
    id: 'features',
    title: 'Играйте прямо здесь.',
    content: 'Никаких регистраций и загрузок. Откройте доску, нажмите на фигуру и сделайте первый ход — ИИ ответит мгновенно.',
    showButton: true,
    buttonText: 'Открыть доску'
  },
  {
    id: 'play',
    title: '',
    isGameSection: true,
  },
  {
    id: 'join',
    title: 'Каждая партия — новый вызов.',
    content: 'Проигрывайте, учитесь, побеждайте. ИИ не устаёт и всегда готов к реваншу.',
    showButton: true,
    buttonText: 'Новая партия'
  },
]