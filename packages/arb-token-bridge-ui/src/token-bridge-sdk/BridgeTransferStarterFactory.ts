import {
  BridgeTransferStarter,
  BridgeTransferStarterPropsWithChainIds
} from './BridgeTransferStarter'
import { EthDepositStarter } from './EthDepositStarter'
import { Erc20DepositStarter } from './Erc20DepositStarter'
import { XErc20DepositStarter } from './XErc20DepositStarter'
import { EthWithdrawalStarter } from './EthWithdrawalStarter'
import { Erc20WithdrawalStarter } from './Erc20WithdrawalStarter'
import { XErc20WithdrawalStarter } from './XErc20WithdrawalStarter'
import { getBridgeTransferProperties } from './utils'
import { getProviderForChainId } from '../hooks/useNetworks'

function getCacheKey(props: BridgeTransferStarterPropsWithChainIds): string {
  let cacheKey = `source:${props.sourceChainId}-destination:${props.destinationChainId}`

  if (props.sourceChainErc20Address) {
    cacheKey += `-sourceErc20:${props.sourceChainErc20Address}`
  }

  if (props.destinationChainErc20Address) {
    cacheKey += `-destinationErc20:${props.destinationChainErc20Address}`
  }

  return cacheKey
}

function withCache(
  key: string,
  value: BridgeTransferStarter
): BridgeTransferStarter {
  cache[key] = value
  return value
}

const cache: { [key: string]: BridgeTransferStarter } = {}

export class BridgeTransferStarterFactory {
  public static create(
    props: BridgeTransferStarterPropsWithChainIds
  ): BridgeTransferStarter {
    const sourceChainProvider = getProviderForChainId(props.sourceChainId)
    const destinationChainProvider = getProviderForChainId(
      props.destinationChainId
    )

    // once we have the providers, we can get the transfer properties, and initialize the classes further
    const initProps = {
      sourceChainProvider,
      destinationChainProvider,
      sourceChainErc20Address: props.sourceChainErc20Address,
      destinationChainErc20Address: props.destinationChainErc20Address,
      adapters: props.adapters
    }

    const { isDeposit, isNativeCurrencyTransfer, isSupported } =
      getBridgeTransferProperties(props)

    if (!isSupported) {
      throw new Error('Unsupported transfer detected')
    }

    const cacheKey = getCacheKey(props)
    const cacheValue = cache[cacheKey]

    if (typeof cacheValue !== 'undefined') {
      return cacheValue
    }

    // deposits
    if (isDeposit) {
      if (!isNativeCurrencyTransfer) {
        console.log('props.depositAdapter', props.adapters?.deposit)
        if (props.adapters?.deposit) {
          console.log('using xerc20 deposit')
          return withCache(cacheKey, new XErc20DepositStarter(initProps))
        } else {
          return withCache(cacheKey, new Erc20DepositStarter(initProps))
        }
      }
      return withCache(cacheKey, new EthDepositStarter(initProps))
    }
    // withdrawals
    if (!isNativeCurrencyTransfer) {
      // console.log('props.withdrawalAdapter', props.adapters?.withdrawal)
      //  if (props.adapters?.withdrawal) {
      //console.log('using xerc20 withdrawal')
      // return withCache(cacheKey, new XErc20WithdrawalStarter(initProps))
      //  } else {
      return withCache(cacheKey, new Erc20WithdrawalStarter(initProps))
      // }
    }
    return withCache(cacheKey, new EthWithdrawalStarter(initProps))
  }
}
