import * as React from 'react'
import { NumericFormat, type NumericFormatProps } from 'react-number-format'

import { Input } from '@/components/ui/input'

const PriceInput = React.forwardRef<
  React.ElementRef<typeof NumericFormat>,
  NumericFormatProps
>((props, ref) => {
  return (
    <NumericFormat
      customInput={Input}
      displayType="input"
      decimalScale={2}
      decimalSeparator=","
      thousandSeparator="."
      fixedDecimalScale={true}
      allowNegative={false}
      getInputRef={ref}
      {...props}
    />
  )
})

PriceInput.displayName = 'PriceInput'

export { PriceInput }
