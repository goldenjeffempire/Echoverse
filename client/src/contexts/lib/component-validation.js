/**
 * LOW-013: Component prop validation with Zod
 */
import { z } from 'zod';
// Button component schema
export const ButtonPropsSchema = z.object({
    variant: z.enum(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']).optional(),
    size: z.enum(['default', 'sm', 'lg', 'icon']).optional(),
    disabled: z.boolean().optional(),
    onClick: z.function().optional(),
    children: z.any(),
    className: z.string().optional(),
});
// Input component schema
export const InputPropsSchema = z.object({
    type: z.enum(['text', 'password', 'email', 'number', 'tel', 'url']).optional(),
    placeholder: z.string().optional(),
    value: z.string().optional(),
    onChange: z.function().optional(),
    disabled: z.boolean().optional(),
    required: z.boolean().optional(),
    className: z.string().optional(),
    error: z.string().optional(),
});
// Card component schema
export const CardPropsSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    children: z.any(),
    className: z.string().optional(),
    onClick: z.function().optional(),
});
// Modal component schema
export const ModalPropsSchema = z.object({
    isOpen: z.boolean(),
    onClose: z.function(),
    title: z.string(),
    children: z.any(),
    size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
    className: z.string().optional(),
});
// Validation helper
export function validateProps(schema, props) {
    const result = schema.safeParse(props);
    if (!result.success) {
        console.error('Component prop validation failed:', result.error.format());
        throw new Error(`Invalid props: ${result.error.message}`);
    }
    return result.data;
}
