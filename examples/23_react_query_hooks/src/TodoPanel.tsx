// Example consumer of the generated TanStack Query hooks.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    useSearchTodos,
    useGetStats,
    useCreateTodoMutation,
    searchTodosKeys,
    getStatsKeys,
} from "./example23Hooks";

export function TodoPanel() {
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    // GET endpoints become useQuery hooks; the whole request object is part of the query key,
    // so changing the search re-fetches (and caches) automatically.
    const todos = useSearchTodos({ search, done: null });

    // Parameterless GET: key factory has `all` only.
    const stats = useGetStats({ staleTime: 60_000 });

    // POST endpoints become useMutation hooks. Invalidation is wired explicitly through the
    // exported key factories - the generator does not invalidate anything automatically.
    const createTodo = useCreateTodoMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: searchTodosKeys.all });
            queryClient.invalidateQueries({ queryKey: getStatsKeys.all });
        },
    });

    return (
        <div>
            <input
                placeholder="Search todos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <button
                type="button"
                disabled={createTodo.isPending}
                onClick={() => createTodo.mutate({ title: search })}
            >
                Add
            </button>
            {stats.data?.response && (
                <p>
                    {stats.data.response.done} / {stats.data.response.total} done
                </p>
            )}
            <ul>
                {todos.data?.response?.map((todo) => (
                    <li key={todo.id}>
                        {todo.title} {todo.done ? "✓" : ""}
                    </li>
                ))}
            </ul>
        </div>
    );
}
