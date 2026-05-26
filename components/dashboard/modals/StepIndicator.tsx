interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full px-1">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={`h-px flex-1 transition-colors duration-300 ${
                      isCompleted ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : isCompleted
                        ? 'border-slate-700 bg-slate-700 text-white'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {stepNumber}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-px flex-1 transition-colors duration-300 ${
                      isCompleted ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-2 hidden text-center text-[10px] font-semibold uppercase tracking-wider sm:block ${
                  isActive ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
