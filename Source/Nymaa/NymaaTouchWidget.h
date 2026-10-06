#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "NymaaTouchWidget.generated.h"

class ANymaaPlayerController;

UCLASS()
class NYMAA_API UNymaaTouchWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    void SetOwningController(ANymaaPlayerController* InController);
    void SetState(bool bInDriving, bool bInCanInteract, bool bInTouch, FVector2D InStart, FVector2D InPosition);

protected:
    virtual int32 NativePaint(
        const FPaintArgs& Args,
        const FGeometry& AllottedGeometry,
        const FSlateRect& MyCullingRect,
        FSlateWindowElementList& OutDrawElements,
        int32 LayerId,
        const FWidgetStyle& InWidgetStyle,
        bool bParentEnabled) const override;

private:
    TWeakObjectPtr<ANymaaPlayerController> Controller;
    bool bDriving = false;
    bool bCanInteract = false;
    bool bTouch = false;
    FVector2D TouchStart = FVector2D::ZeroVector;
    FVector2D TouchPosition = FVector2D::ZeroVector;
};
