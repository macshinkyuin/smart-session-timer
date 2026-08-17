import { useKeepAwake } from 'expo-keep-awake';

type Props = {
  tag?: string;
};

export function KeepAwakeGuard({ tag = 'smart-session-timer-running' }: Props) {
  useKeepAwake(tag);
  return null;
}
