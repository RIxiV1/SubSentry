import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
}

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
}: DeleteConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
            {itemName && (
              <span className="block mt-2 font-semibold text-foreground">
                "{itemName}"
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3">
          <AlertDialogCancel className="flex-1">
            Nah, keep it
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, delete it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
