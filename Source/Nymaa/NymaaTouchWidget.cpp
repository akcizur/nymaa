#include "NymaaTouchWidget.h"

#include "NymaaPlayerController.h"

#include "Styling/AppStyle.h"
#include "Rendering/DrawElements.h"

void UNymaaTouchWidget::SetOwningController(ANymaaPlayerController* InController)
{
    Controller = InController;
}

void UNymaaTouchWidget::SetState(
    bool bInDriving,
    bool bInCanInteract,
    bool bInTouch,
    FVector2D InStart,
    FVector2D InPosition)
{
    bDriving = bInDriving;
    bCanInteract = bInCanInteract;
    bTouch = bInTouch;
    TouchStart = InStart;
    TouchPosition = InPosition;
    Invalidate(EInvalidateWidgetReason::Paint);
}

int32 UNymaaTouchWidget::NativePaint(
    const FPaintArgs& Args,
    const FGeometry& AllottedGeometry,
    const FSlateRect& MyCullingRect,
    FSlateWindowElementList& OutDrawElements,
    int32 LayerId,
    const FWidgetStyle& InWidgetStyle,
    bool bParentEnabled) const
{
    LayerId = Super::NativePaint(
        Args,
        AllottedGeometry,
        MyCullingRect,
        OutDrawElements,
        LayerId,
        InWidgetStyle,
        bParentEnabled
    );

    const FVector2D Size = AllottedGeometry.GetLocalSize();

    const FVector2D StickCenter(110.0f, Size.Y - 110.0f);
    const float StickRadius = 70.0f;
    const FVector2D ActionCenter(Size.X - 100.0f, Size.Y - 100.0f);
    const float ActionRadius = 42.0f;

    auto DrawCircle = [&](const FVector2D& Center, float Radius, const FLinearColor& Color, float Thickness)
    {
        TArray<FVector2D> Points;
        constexpr int32 Segments = 48;
        Points.Reserve(Segments + 1);

        for (int32 i = 0; i <= Segments; ++i)
        {
            const float A = (2.0f * PI * i) / Segments;
            Points.Add(Center + FVector2D(FMath::Cos(A), FMath::Sin(A)) * Radius);
        }

        FSlateDrawElement::MakeLines(
            OutDrawElements,
            LayerId,
            AllottedGeometry.ToPaintGeometry(),
            Points,
            ESlateDrawEffect::None,
            Color,
            true,
            Thickness
        );
    };

    const FVector2D KnobPosition = bTouch
        ? TouchPosition
        : StickCenter;

    DrawCircle(StickCenter, StickRadius, FLinearColor(1,1,1,0.20f), 2.0f);
    DrawCircle(KnobPosition, 28.0f, FLinearColor(1,1,1,0.30f), 2.0f);

    if (bCanInteract || bDriving)
    {
        DrawCircle(ActionCenter, ActionRadius, FLinearColor(1,1,1,0.30f), 2.0f);

        const FSlateFontInfo Font = FAppStyle::Get().GetFontStyle("NormalFont");
        const FText Text = FText::FromString(bDriving ? TEXT("EXIT") : TEXT("E"));

        FSlateDrawElement::MakeText(
            OutDrawElements,
            LayerId + 1,
            AllottedGeometry.ToPaintGeometry(FVector2D(70, 40), FSlateLayoutTransform(ActionCenter - FVector2D(35, 20))),
            Text,
            Font,
            ESlateDrawEffect::None,
            FLinearColor::White
        );
    }

    return LayerId + 1;
}
