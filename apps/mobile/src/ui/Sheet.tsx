// `docs/12` §5: `@gorhom/bottom-sheet` wrapper with a standard header/handle/safe area. The
// consuming app must wrap its root in `BottomSheetModalProvider` and `GestureHandlerRootView`
// (an app-shell concern, not `ui/`'s — see `@gorhom/bottom-sheet`'s own setup docs).
import { forwardRef, useEffect, useImperativeHandle, useRef, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface SheetHandle {
  readonly present: () => void;
  readonly dismiss: () => void;
}

export interface SheetProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  /** Already-translated sheet title, shown in the standard header. */
  readonly title?: string;
  readonly children: ReactNode;
  readonly snapPoints?: readonly (string | number)[];
  readonly testID?: string;
}

/* ── Implementation ───────────────────────────────────── */

const DEFAULT_SNAP_POINTS = ['50%'] as const;

export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { visible, onDismiss, title, children, snapPoints = DEFAULT_SNAP_POINTS, testID },
  ref,
) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const modalRef = useRef<ComponentRef<typeof BottomSheetModal>>(null);

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  useEffect(() => {
    if (visible) modalRef.current?.present();
    else modalRef.current?.dismiss();
  }, [visible]);

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints as string[] | number[]}
      onDismiss={onDismiss}
      backgroundStyle={{ backgroundColor: theme.colors.bgSurfaceRaised, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.borderStrong }}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
    >
      <BottomSheetView testID={testID} style={[styles.content, { paddingBottom: insets.bottom + theme.spacing['16'] }]}>
        {title ? (
          <View style={[styles.header, { paddingHorizontal: theme.spacing['16'] }]}>
            <Text variant="title">{title}</Text>
          </View>
        ) : null}
        <View style={{ paddingHorizontal: theme.spacing['16'] }}>{children}</View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  header: { paddingBottom: 12 },
});
