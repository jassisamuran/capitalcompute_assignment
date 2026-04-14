import React from 'react'

interface SectionLabelProps {
  text: string
}

const SectionLabel: React.FC<SectionLabelProps> = ({ text }) => {
  return (
    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
      {text}
    </p>
  )
}

export default SectionLabel