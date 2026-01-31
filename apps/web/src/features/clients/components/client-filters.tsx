import { X } from "lucide-react";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import type { Tag } from "@/types/common.types";

interface ClientFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	selectedTags: string[];
	onTagToggle: (tagId: string) => void;
	onClearTags: () => void;
	availableTags: Tag[];
}

export function ClientFilters({
	search,
	onSearchChange,
	selectedTags,
	onTagToggle,
	onClearTags,
	availableTags,
}: ClientFiltersProps) {
	const [showTagFilter, setShowTagFilter] = useState(false);

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<SearchInput
					className="max-w-sm"
					onChange={onSearchChange}
					placeholder="Buscar por nome ou empresa..."
					value={search}
				/>
				<Button
					onClick={() => setShowTagFilter(!showTagFilter)}
					size="sm"
					variant="outline"
				>
					Filtrar por tags
					{selectedTags.length > 0 && (
						<span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-white text-xs">
							{selectedTags.length}
						</span>
					)}
				</Button>
				{selectedTags.length > 0 && (
					<Button onClick={onClearTags} size="sm" variant="ghost">
						<X className="mr-1 h-4 w-4" />
						Limpar filtros
					</Button>
				)}
			</div>

			{showTagFilter && (
				<div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-3">
					{availableTags.map((tag) => {
						const isSelected = selectedTags.includes(tag.id);
						return (
							<button
								className={`rounded-full border px-3 py-1 text-sm transition-colors ${
									isSelected
										? "border-brand-500 bg-brand-50 text-brand-700"
										: "border-border bg-background hover:bg-accent"
								}`}
								key={tag.id}
								onClick={() => onTagToggle(tag.id)}
								type="button"
							>
								<span
									className="mr-1.5 inline-block h-2 w-2 rounded-full"
									style={{ backgroundColor: tag.color }}
								/>
								{tag.name}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
