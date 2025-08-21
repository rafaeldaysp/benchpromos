import { cn } from '@/lib/utils'
import {
  type Cashback,
  type Coupon,
  type Deal,
  type Discount,
  type Retailer,
} from '@/types'
import { couponFormatter, priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'
import { CashbackModal } from './cashback-modal'
import { CouponModal } from './coupon-modal'
import { Icons } from './icons'
import { Badge } from './ui/badge'
import { buttonVariants } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

interface PriceComponentProps {
  bestDeal: Deal & {
    cashback: Cashback
    coupon: Coupon
    retailer: Retailer
    discounts: Discount[]
  }
  bestInstallmentDeal:
    | (Deal & {
        cashback: Cashback
        coupon: Coupon
        retailer: Retailer
        discounts: Discount[]
      })
    | null
    | undefined
}

export function PriceComponent({
  bestDeal,
  bestInstallmentDeal,
}: PriceComponentProps) {
  return (
    <Tabs defaultValue="1x" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="1x" className="w-1/2">
          À vista
        </TabsTrigger>
        <TabsTrigger
          value="installment"
          className="w-1/2"
          disabled={!bestInstallmentDeal?.totalInstallmentPrice}
        >
          Parcelado
        </TabsTrigger>
      </TabsList>

      <TabsContent value="1x">
        <div className="flex w-full flex-col gap-y-2 text-sm">
          <div className="flex flex-col gap-y-1">
            {bestDeal.saleId && (
              <div className="h-fit rounded-lg bg-auxiliary/20 py-1 text-center text-xs text-muted-foreground">
                <strong className="text-auxiliary">EM PROMOÇÃO</strong>
              </div>
            )}
            <p className="text-muted-foreground">
              menor preço à vista via <strong>{bestDeal.retailer.name}</strong>
            </p>

            <p>
              <strong className="text-3xl">
                {priceFormatter.format(
                  priceCalculator(
                    bestDeal.price,
                    bestDeal.coupon?.availability
                      ? bestDeal.coupon.discount
                      : undefined,
                    undefined,
                    bestDeal.discounts.map((discount) => discount.discount),
                  ) / 100,
                )}
              </strong>{' '}
              <span className="text-muted-foreground">à vista </span>
            </p>

            {bestDeal.discounts.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {bestDeal.discounts.map((discount) => (
                  <TooltipProvider key={discount.id} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="success" className="uppercase">
                          {couponFormatter(discount.discount)} {discount.label}
                        </Badge>
                      </TooltipTrigger>
                      {discount.description && (
                        <TooltipContent>
                          <p>{discount.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}

            {bestDeal.cashback && (
              <div className="flex flex-col items-start rounded-xl bg-auxiliary/20 px-4 py-2 text-sm text-muted-foreground">
                <span className="flex items-center font-semibold">
                  <Icons.AlertCircle className="mr-2 size-4 text-auxiliary" />
                  Preço final com cashback
                </span>
                <span className="ml-1 text-foreground">
                  <p>
                    <strong className="text-xl">
                      {priceFormatter.format(
                        priceCalculator(
                          bestDeal.price,
                          bestDeal.coupon?.availability
                            ? bestDeal.coupon.discount
                            : undefined,
                          bestDeal.cashback?.value,
                          bestDeal.discounts.map(
                            (discount) => discount.discount,
                          ),
                        ) / 100,
                      )}
                    </strong>{' '}
                    <span className="text-muted-foreground">à vista </span>
                  </p>
                </span>
              </div>
            )}
          </div>
          {bestDeal.coupon?.availability && (
            <CouponModal
              coupon={bestDeal.coupon}
              description={
                <span className="text-muted-foreground">
                  {couponFormatter(bestDeal.coupon.discount)} de desconto{' '}
                  <span className="hidden sm:inline-flex">neste produto</span>
                </span>
              }
            />
          )}

          {bestDeal.cashback && (
            <CashbackModal
              cashback={bestDeal.cashback}
              description={
                <span className="text-muted-foreground">
                  {bestDeal.cashback.value}% de volta com{' '}
                  {bestDeal.cashback.provider}
                </span>
              }
            />
          )}

          <a
            className={cn(
              buttonVariants(),
              'flex h-10 w-full cursor-pointer rounded-xl',
            )}
            href={bestDeal.url}
            target="_blank"
          >
            <span className="mr-2 font-semibold">ACESSAR</span>
          </a>
        </div>
      </TabsContent>
      {bestInstallmentDeal &&
        bestInstallmentDeal.installments &&
        bestInstallmentDeal.totalInstallmentPrice && (
          <TabsContent value="installment">
            <div className="flex w-full flex-col gap-y-2 text-sm">
              <div className="flex flex-col gap-y-1">
                {bestInstallmentDeal.saleId && (
                  <div className="h-fit rounded-lg bg-auxiliary/20 py-1 text-center text-xs text-muted-foreground">
                    <strong className="text-auxiliary">EM PROMOÇÃO</strong>
                  </div>
                )}
                <p className="text-muted-foreground">
                  menor preço parcelado via{' '}
                  <strong>{bestInstallmentDeal.retailer.name}</strong>
                </p>

                <p>
                  <strong className="text-3xl">
                    {priceFormatter.format(
                      priceCalculator(
                        bestInstallmentDeal.totalInstallmentPrice,
                        bestInstallmentDeal.coupon?.availability
                          ? bestInstallmentDeal.coupon.discount
                          : undefined,
                        undefined,
                        bestInstallmentDeal.discounts.map(
                          (discount) => discount.discount,
                        ),
                      ) / 100,
                    )}
                  </strong>{' '}
                  <span className="text-muted-foreground">
                    em <strong>{bestInstallmentDeal.installments}x </strong> de{' '}
                    <strong>
                      {priceFormatter.format(
                        priceCalculator(
                          bestInstallmentDeal.totalInstallmentPrice,
                          bestInstallmentDeal.coupon?.availability
                            ? bestInstallmentDeal.coupon.discount
                            : undefined,
                          undefined,
                          bestInstallmentDeal.discounts.map(
                            (discount) => discount.discount,
                          ),
                        ) /
                          (100 * bestInstallmentDeal.installments),
                      )}
                    </strong>
                  </span>
                </p>

                {bestInstallmentDeal.discounts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {bestInstallmentDeal.discounts.map((discount) => (
                      <TooltipProvider key={discount.id} delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="success" className="uppercase">
                              {couponFormatter(discount.discount)}{' '}
                              {discount.label}
                            </Badge>
                          </TooltipTrigger>
                          {discount.description && (
                            <TooltipContent>
                              <p>{discount.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}

                {bestInstallmentDeal.cashback && (
                  <div className="flex flex-col items-start rounded-xl bg-auxiliary/20 px-4 py-2 text-sm text-muted-foreground">
                    <span className="flex items-center font-semibold">
                      <Icons.AlertCircle className="mr-2 size-4 text-auxiliary" />
                      Preço final com cashback
                    </span>
                    <span className="ml-1 text-foreground">
                      <p>
                        <strong className="text-xl">
                          {priceFormatter.format(
                            priceCalculator(
                              bestInstallmentDeal.totalInstallmentPrice,
                              bestInstallmentDeal.coupon?.availability
                                ? bestInstallmentDeal.coupon.discount
                                : undefined,
                              bestInstallmentDeal.cashback?.value,
                              bestInstallmentDeal.discounts.map(
                                (discount) => discount.discount,
                              ),
                            ) / 100,
                          )}
                        </strong>{' '}
                        <span className="text-muted-foreground">
                          em{' '}
                          <strong>{bestInstallmentDeal.installments}x </strong>{' '}
                          de{' '}
                          <strong>
                            {priceFormatter.format(
                              priceCalculator(
                                bestInstallmentDeal.totalInstallmentPrice,
                                bestInstallmentDeal.coupon?.availability
                                  ? bestInstallmentDeal.coupon.discount
                                  : undefined,
                                bestInstallmentDeal.cashback?.value,
                                bestInstallmentDeal.discounts.map(
                                  (discount) => discount.discount,
                                ),
                              ) /
                                (100 * bestInstallmentDeal.installments),
                            )}
                          </strong>
                        </span>
                      </p>
                    </span>
                  </div>
                )}
              </div>
              {bestInstallmentDeal.coupon?.availability && (
                <CouponModal
                  coupon={bestInstallmentDeal.coupon}
                  description={
                    <span className="text-muted-foreground">
                      {couponFormatter(bestInstallmentDeal.coupon.discount)} de
                      desconto{' '}
                      <span className="hidden sm:inline-flex">
                        neste produto
                      </span>
                    </span>
                  }
                />
              )}

              {bestInstallmentDeal.cashback && (
                <CashbackModal
                  cashback={bestInstallmentDeal.cashback}
                  description={
                    <span className="text-muted-foreground">
                      {bestInstallmentDeal.cashback.value}% de volta com{' '}
                      {bestInstallmentDeal.cashback.provider}
                    </span>
                  }
                />
              )}
              <a
                className={cn(
                  buttonVariants(),
                  'flex h-10 w-full cursor-pointer rounded-xl',
                )}
                href={bestInstallmentDeal.url}
                target="_blank"
              >
                <span className="mr-2 font-semibold">ACESSAR</span>
              </a>
            </div>
          </TabsContent>
        )}
    </Tabs>
  )
}
