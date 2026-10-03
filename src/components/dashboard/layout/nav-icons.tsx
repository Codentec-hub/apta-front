import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { BankIcon } from '@phosphor-icons/react/dist/ssr/Bank';
import { BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { CalculatorIcon } from '@phosphor-icons/react/dist/ssr/Calculator';
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { HeadsetIcon } from '@phosphor-icons/react/dist/ssr/Headset';
import { HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
import { KanbanIcon } from '@phosphor-icons/react/dist/ssr/Kanban';
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt';
import { RobotIcon } from '@phosphor-icons/react/dist/ssr/Robot';
import { SquaresFourIcon } from '@phosphor-icons/react/dist/ssr/SquaresFour';
import { UsersThreeIcon } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { WalletIcon } from '@phosphor-icons/react/dist/ssr/Wallet';

export const navIcons = {
  house: HouseIcon,
  buildings: BuildingsIcon,
  'clipboard-text': ClipboardTextIcon,
  kanban: KanbanIcon,
  headset: HeadsetIcon,
  receipt: ReceiptIcon,
  wallet: WalletIcon,
  bank: BankIcon,
  calculator: CalculatorIcon,
  calendar: CalendarIcon,
  envelope: EnvelopeSimpleIcon,
  robot: RobotIcon,
  'plugs-connected': PlugsConnectedIcon,
  'users-three': UsersThreeIcon,
  'squares-four': SquaresFourIcon,
} as Record<string, Icon>;
