import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Dashboard } from '../store/dashboardStore'
import { useDashboardStore } from '../store/dashboardStore'
import ValueCard from './widgets/ValueCard'
import TrendGraph from './widgets/TrendGraph'
import ProgressBar from './widgets/ProgressBar'
import AlarmLog from './widgets/AlarmLog'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Props {
  dashboard: Dashboard
  editable: boolean
}

export default function DashboardGrid({ dashboard, editable }: Props) {
  const { updateWidget, removeWidget } = useDashboardStore()

  const layouts = {
    lg: dashboard.widgets.map((w) => ({
      i: w.id,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
    })),
  }

  const handleLayoutChange = (layout: Layout[]) => {
    if (!editable) return

    layout.forEach((item) => {
      updateWidget(item.i, {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      })
    })
  }

  const renderWidget = (widget: any) => {
    const commonProps = {
      widget,
      editable,
      onRemove: () => removeWidget(widget.id),
    }

    switch (widget.type) {
      case 'value-card':
        return <ValueCard {...commonProps} />
      case 'trend-graph':
        return <TrendGraph {...commonProps} />
      case 'progress-bar':
        return <ProgressBar {...commonProps} />
      case 'alarm-log':
        return <AlarmLog {...commonProps} />
      default:
        return <div>Unknown widget type</div>
    }
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={60}
      isDraggable={editable}
      isResizable={editable}
      onLayoutChange={handleLayoutChange}
    >
      {dashboard.widgets.map((widget) => (
        <div key={widget.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {renderWidget(widget)}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
