// ============================================================================
// SPRINTHUB - Sprint Board Page Component
// Kanban board with stages and tickets
// ============================================================================

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  featherPlus,
  featherMoreVertical,
  featherArrowLeft,
  featherEdit2,
  featherTrash2,
  featherClock,
  featherAlertCircle,
  featherUser,
  featherTag,
} from '@ng-icons/feather-icons';
import { SprintsService, TicketsService, TagsService, UsersService } from '../../core/services';
import { Ticket, Stage, CreateTicketDto, Priority, TicketType, Tag } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PriorityBadgeDirective } from '../../shared/directives/priority-badge.directive';
import { STAGE_COLORS, TAG_COLORS } from '../../shared/constants/colors';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [FormsModule, NgIconComponent, CdkDropListGroup, CdkDropList, CdkDrag, ModalComponent, InputComponent, ButtonComponent, PriorityBadgeDirective],
  viewProviders: [
    provideIcons({
      featherPlus,
      featherMoreVertical,
      featherArrowLeft,
      featherEdit2,
      featherTrash2,
      featherClock,
      featherAlertCircle,
      featherUser,
      featherTag,
    }),
  ],
  template: `
    <div class="h-[calc(100vh-64px)] flex flex-col bg-gray-100">
      @if (sprintsService.loading()) {
        <div class="flex items-center justify-center flex-1">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (sprintsService.currentSprint(); as sprint) {
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button (click)="goBack()"
             class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <ng-icon name="featherArrowLeft" class="text-xl" />
          </button>
          <div class="flex-1">
            <h1 class="text-xl font-bold text-gray-900">{{ sprint.name }}</h1>
            @if (sprint.goal) {
              <p class="text-sm text-gray-500">{{ sprint.goal }}</p>
            }
          </div>
          <!-- Sprint status badge -->
          <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                [class.bg-yellow-100]="sprint.status === 'PLANNING'"
                [class.text-yellow-700]="sprint.status === 'PLANNING'"
                [class.bg-green-100]="sprint.status === 'ACTIVE'"
                [class.text-green-700]="sprint.status === 'ACTIVE'"
                [class.bg-blue-100]="sprint.status === 'COMPLETED'"
                [class.text-blue-700]="sprint.status === 'COMPLETED'">
            {{ getStatusLabel(sprint.status) }}
          </span>
          <app-button variant="secondary" (click)="openTagManager()">
            <ng-icon name="featherTag" />
            Tags
          </app-button>
          <app-button (click)="showStageModal.set(true)">
            <ng-icon name="featherPlus" />
            New Stage
          </app-button>
        </div>

        <!-- Kanban Board -->
        <div class="flex-1 overflow-x-auto p-4" cdkDropListGroup>
          <div class="flex gap-4 h-full">
            @for (stage of sprint.stages; track stage.id) {
              <div class="w-80 flex-shrink-0 bg-gray-200 rounded-xl flex flex-col max-h-full">
                <!-- Stage Header -->
                <div class="p-3 flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" [style.background-color]="stage.color"></div>
                  <h3 class="font-semibold text-gray-800 flex-1">{{ stage.name }}</h3>
                  <span class="text-sm text-gray-500">{{ stage.tickets?.length || 0 }}</span>
                  <div class="relative">
                    <button (click)="toggleStageMenu(stage.id)"
                            class="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <ng-icon name="featherMoreVertical" />
                    </button>
                    @if (activeStageMenu() === stage.id) {
                      <div class="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border
                                  border-gray-200 py-1 z-20">
                        <button (click)="editStage(stage)"
                                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700
                                       hover:bg-gray-50">
                          <ng-icon name="featherEdit2" />
                          Edit
                        </button>
                        <button (click)="deleteStage(stage)"
                                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600
                                       hover:bg-red-50">
                          <ng-icon name="featherTrash2" />
                          Delete
                        </button>
                      </div>
                    }
                  </div>
                </div>

                <!-- Tickets List -->
                <div class="flex-1 overflow-y-auto px-3 pb-3"
                     cdkDropList
                     [cdkDropListData]="stage.tickets || []"
                     (cdkDropListDropped)="onTicketDrop($event, stage)">
                  @for (ticket of stage.tickets; track ticket.id) {
                    <div cdkDrag
                         (click)="openTicketModal(ticket)"
                         class="bg-white rounded-lg p-3 mb-2 shadow-sm hover:shadow-md
                                transition-shadow cursor-pointer border border-gray-100
                                active:shadow-lg">
                      <!-- Tag -->
                      @if (ticket.tag) {
                        <div class="mb-2">
                          <span class="px-2 py-0.5 text-xs rounded-full text-white"
                                [style.background-color]="ticket.tag.color">
                            {{ ticket.tag.name }}
                          </span>
                        </div>
                      }

                      <!-- Code & Title -->
                      <div class="flex items-start gap-2 mb-2">
                        @if (ticket.code) {
                          <span class="text-xs text-indigo-500 font-mono font-medium shrink-0">{{ ticket.code }}</span>
                        }
                        <h4 class="font-medium text-gray-900">{{ ticket.title }}</h4>
                      </div>

                      <!-- Meta -->
                      <div class="flex items-center gap-3 text-xs text-gray-500">
                        <!-- Ticket type -->
                        @if (ticket.type && ticket.type !== 'TASK') {
                          <span class="px-1.5 py-0.5 rounded text-xs font-medium"
                                [class.bg-red-100]="ticket.type === 'BUG'"
                                [class.text-red-700]="ticket.type === 'BUG'"
                                [class.bg-purple-100]="ticket.type === 'FEATURE'"
                                [class.text-purple-700]="ticket.type === 'FEATURE'"
                                [class.bg-cyan-100]="ticket.type === 'IMPROVEMENT'"
                                [class.text-cyan-700]="ticket.type === 'IMPROVEMENT'">
                            {{ getTypeLabel(ticket.type) }}
                          </span>
                        }
                        @if (ticket.dueDate) {
                          <span class="flex items-center gap-1"
                                [class.text-red-500]="isOverdue(ticket.dueDate)"
                                [class.text-orange-500]="isDueSoon(ticket.dueDate) && !isOverdue(ticket.dueDate)">
                            <ng-icon name="featherClock" />
                            {{ formatDate(ticket.dueDate) }}
                          </span>
                        }
                        @if (ticket.estimatedHours) {
                          <span class="text-gray-400">{{ ticket.estimatedHours }}h</span>
                        }
                        @if (ticket.assignee) {
                          <span class="flex items-center gap-1">
                            <ng-icon name="featherUser" />
                            {{ ticket.assignee.name.split(' ')[0] }}
                          </span>
                        }
                      </div>

                      <!-- Priority Badge -->
                      @if (ticket.priority !== 'MEDIUM') {
                        <div class="mt-2">
                          <span [appPriorityBadge]="ticket.priority"></span>
                        </div>
                      }
                    </div>
                  }

                  <!-- Add Ticket Button -->
                  <button (click)="openNewTicketModal(stage)"
                          class="w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                                 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <ng-icon name="featherPlus" />
                    Add Ticket
                  </button>
                </div>
              </div>
            }

            <!-- Add Stage Placeholder -->
            <button (click)="showStageModal.set(true)"
                    class="w-80 flex-shrink-0 bg-gray-200/50 border-2 border-dashed border-gray-300
                           rounded-xl flex items-center justify-center gap-2 text-gray-500
                           hover:text-gray-700 hover:bg-gray-200 hover:border-gray-400 transition-colors">
              <ng-icon name="featherPlus" />
              Add Stage
            </button>
          </div>
        </div>

        <!-- Stage Modal -->
        @if (showStageModal()) {
          <app-modal [title]="editingStage() ? 'Edit Stage' : 'New Stage'" (closed)="closeStageModal()">
            <form (ngSubmit)="saveStage()" class="p-4 space-y-4">
              <app-input label="Name" [(value)]="stageForm.name" [required]="true" />

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div class="flex gap-2">
                  @for (color of stageColors; track color) {
                    <button type="button"
                            (click)="stageForm.color = color"
                            [class.ring-2]="stageForm.color === color"
                            class="w-8 h-8 rounded-full ring-gray-400 ring-offset-2"
                            [style.background-color]="color">
                    </button>
                  }
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <app-button variant="secondary" class="flex-1" (click)="closeStageModal()">
                  Cancel
                </app-button>
                <app-button type="submit" class="flex-1" [disabled]="!stageForm.name">
                  {{ editingStage() ? 'Save' : 'Create' }}
                </app-button>
              </div>
            </form>
          </app-modal>
        }

        <!-- Ticket Modal -->
        @if (showTicketModal()) {
          <app-modal [title]="editingTicket() ? 'Edit Ticket' : 'New Ticket'" maxWidth="max-w-lg"
                     (closed)="closeTicketModal()">
            <form (ngSubmit)="saveTicket()" class="p-4 space-y-4">
              <app-input label="Title" [(value)]="ticketForm.title" [required]="true" />
              <app-input label="Description" [(value)]="ticketForm.description" [rows]="3" />

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select [(ngModel)]="ticketForm.type"
                          name="type"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                    <option value="FEATURE">Feature</option>
                    <option value="IMPROVEMENT">Improvement</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select [(ngModel)]="ticketForm.priority"
                          name="priority"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <app-input label="Due Date" type="date" [(value)]="ticketForm.dueDate" />
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <input type="number" [(ngModel)]="ticketForm.estimatedHours" name="estimatedHours"
                         min="0" step="0.5"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Assignee Picker -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select [(ngModel)]="ticketForm.assigneeId"
                          name="assigneeId"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option [ngValue]="null">-- Unassigned --</option>
                    @for (user of usersService.users(); track user.id) {
                      <option [ngValue]="user.id">{{ user.name }}</option>
                    }
                  </select>
                </div>

                <!-- Tag Picker (single select) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                  <select [(ngModel)]="ticketForm.tagId"
                          name="tagId"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option [ngValue]="null">-- No Tag --</option>
                    @for (tag of tagsService.tags(); track tag.id) {
                      <option [ngValue]="tag.id">{{ tag.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <app-button variant="secondary" class="flex-1" (click)="closeTicketModal()">
                  Cancel
                </app-button>
                @if (editingTicket()) {
                  <app-button variant="danger" (click)="deleteTicket()">Delete</app-button>
                }
                <app-button type="submit" class="flex-1" [disabled]="!ticketForm.title">
                  {{ editingTicket() ? 'Save' : 'Create' }}
                </app-button>
              </div>
            </form>
          </app-modal>
        }

        <!-- Tag Manager Modal -->
        @if (showTagModal()) {
          <app-modal title="Manage Tags" (closed)="closeTagManager()">
            <div class="flex flex-col max-h-[70vh]">
              <!-- Existing Tags -->
              <div class="flex-1 overflow-y-auto p-4 min-h-0">
                <div class="space-y-2">
                  @for (tag of tagsService.tags(); track tag.id) {
                    <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                      <div class="w-4 h-4 rounded-full" [style.background-color]="tag.color"></div>
                      <span class="flex-1">{{ tag.name }}</span>
                      <button (click)="editTagStart(tag)"
                              class="p-1 text-gray-400 hover:text-gray-600">
                        <ng-icon name="featherEdit2" />
                      </button>
                      <button (click)="deleteTag(tag)"
                              class="p-1 text-gray-400 hover:text-red-600">
                        <ng-icon name="featherTrash2" />
                      </button>
                    </div>
                  }
                  @if (tagsService.tags().length === 0) {
                    <p class="text-sm text-gray-500 text-center py-4">No tags</p>
                  }
                </div>
              </div>

              <!-- Add/Edit Tag Form -->
              <div class="flex-shrink-0 border-t p-4 bg-gray-50">
                <h4 class="text-sm font-medium text-gray-700 mb-3">
                  {{ editingTag() ? 'Edit Tag' : 'New Tag' }}
                </h4>
                <div class="space-y-3">
                  <input [(ngModel)]="tagForm.name"
                         placeholder="Tag name"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <div class="flex flex-wrap gap-2">
                    @for (color of tagColors; track color) {
                      <button type="button"
                              (click)="tagForm.color = color"
                              [class.ring-2]="tagForm.color === color"
                              class="w-8 h-8 rounded-full ring-gray-400 ring-offset-1"
                              [style.background-color]="color">
                      </button>
                    }
                  </div>
                  <div class="flex gap-2">
                    @if (editingTag()) {
                      <app-button variant="secondary" class="flex-1" (click)="cancelEditTag()">Cancel</app-button>
                    }
                    <app-button class="flex-1" (click)="saveTag()" [disabled]="!tagForm.name">
                      {{ editingTag() ? 'Save' : 'Add' }}
                    </app-button>
                  </div>
                </div>
              </div>
            </div>
          </app-modal>
        }

        <!-- Delete Stage Confirm Modal -->
        @if (stageToDelete()) {
          <app-modal title="Delete Stage" (closed)="stageToDelete.set(null)" maxWidth="max-w-xs">
            <div class="p-4 text-center">
              <p class="text-gray-700 mb-4">
                Delete stage <strong>{{ stageToDelete()?.name }}</strong>?
              </p>
              <div class="flex gap-2">
                <app-button variant="secondary" class="flex-1" (click)="stageToDelete.set(null)">Cancel</app-button>
                <app-button variant="danger" class="flex-1" (click)="confirmDeleteStage()">Delete</app-button>
              </div>
            </div>
          </app-modal>
        }

        <!-- Delete Ticket Confirm Modal -->
        @if (ticketToDelete()) {
          <app-modal title="Delete Ticket" (closed)="ticketToDelete.set(null)" maxWidth="max-w-xs">
            <div class="p-4 text-center">
              <p class="text-gray-700 mb-4">Are you sure you want to delete this ticket?</p>
              <div class="flex gap-2">
                <app-button variant="secondary" class="flex-1" (click)="ticketToDelete.set(null)">Cancel</app-button>
                <app-button variant="danger" class="flex-1" (click)="confirmDeleteTicket()">Delete</app-button>
              </div>
            </div>
          </app-modal>
        }

        <!-- Delete Tag Confirm Modal -->
        @if (tagToDelete()) {
          <app-modal title="Delete Tag" (closed)="cancelDeleteTag()" maxWidth="max-w-sm">
            <div class="p-4 text-center">
              @if (tagDeleteWarning()) {
                <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100">
                  <ng-icon name="featherAlertCircle" class="text-orange-600 text-2xl" />
                </div>
                <p class="text-gray-700 font-medium mb-2">{{ tagDeleteWarning() }}</p>
                <p class="text-gray-500 text-sm mb-4">The tag will be removed from all tickets.</p>
              } @else {
                <p class="text-gray-700 mb-4">
                  Are you sure you want to delete the tag <strong>{{ tagToDelete()?.name }}</strong>?
                </p>
              }
              <div class="flex gap-2">
                <app-button variant="secondary" class="flex-1" (click)="cancelDeleteTag()">Cancel</app-button>
                <app-button variant="danger" class="flex-1" (click)="confirmDeleteTag()">
                  {{ tagDeleteWarning() ? 'Delete Anyway' : 'Delete' }}
                </app-button>
              </div>
            </div>
          </app-modal>
        }

        <!-- Error Modal -->
        @if (errorMessage()) {
          <app-modal title="Error" (closed)="errorMessage.set(null)" maxWidth="max-w-xs">
            <div class="p-4 text-center">
              <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-100">
                <ng-icon name="featherAlertCircle" class="text-red-600 text-2xl" />
              </div>
              <p class="text-gray-700 font-medium mb-4">{{ errorMessage() }}</p>
              <app-button class="w-full" (click)="errorMessage.set(null)">OK</app-button>
            </div>
          </app-modal>
        }
      }
    </div>
  `,
  styles: [`
    .cdk-drag-preview {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border-radius: 0.5rem;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `],
})
export class BoardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  sprintsService = inject(SprintsService);
  ticketsService = inject(TicketsService);
  tagsService = inject(TagsService);
  usersService = inject(UsersService);

  showStageModal = signal(false);
  showTicketModal = signal(false);
  showTagModal = signal(false);
  editingStage = signal<Stage | null>(null);
  editingTicket = signal<Ticket | null>(null);
  editingTag = signal<Tag | null>(null);
  selectedStage = signal<Stage | null>(null);
  activeStageMenu = signal<number | null>(null);
  stageToDelete = signal<Stage | null>(null);
  ticketToDelete = signal<Ticket | null>(null);
  tagToDelete = signal<Tag | null>(null);
  tagDeleteWarning = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  stageForm = { name: '', color: '#6b7280' };
  ticketForm = {
    title: '',
    description: '',
    stageId: 0,
    type: 'TASK' as TicketType,
    priority: 'MEDIUM' as Priority,
    dueDate: '',
    estimatedHours: null as number | null,
    tagId: null as number | null,
    assigneeId: null as number | null,
  };
  tagForm = { name: '', color: '#6b7280' };

  stageColors = STAGE_COLORS;
  tagColors = TAG_COLORS;

  private clickHandler = () => this.activeStageMenu.set(null);

  ngOnInit() {
    const sprintId = Number(this.route.snapshot.paramMap.get('id'));
    this.sprintsService.get(sprintId).subscribe((sprint) => {
      this.tagsService.list(sprint.workspaceId).subscribe();
    });

    this.usersService.listForDropdown().subscribe();

    document.addEventListener('click', this.clickHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.clickHandler);
    this.sprintsService.clearCurrent();
  }

  goBack() {
    this.router.navigate(['/workspaces']);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PLANNING: 'Planning',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      TASK: 'Task',
      BUG: 'Bug',
      FEATURE: 'Feature',
      IMPROVEMENT: 'Improvement',
    };
    return labels[type] || type;
  }

  toggleStageMenu(stageId: number) {
    event?.stopPropagation();
    this.activeStageMenu.update((id) => (id === stageId ? null : stageId));
  }

  // ===== STAGE OPERATIONS =====

  editStage(stage: Stage) {
    this.editingStage.set(stage);
    this.stageForm = { name: stage.name, color: stage.color };
    this.activeStageMenu.set(null);
    this.showStageModal.set(true);
  }

  deleteStage(stage: Stage) {
    this.activeStageMenu.set(null);
    this.stageToDelete.set(stage);
  }

  confirmDeleteStage() {
    const stage = this.stageToDelete();
    if (!stage) return;
    this.sprintsService.deleteStage(stage.id).subscribe({
      next: () => this.stageToDelete.set(null),
      error: (err) => {
        this.stageToDelete.set(null);
        this.errorMessage.set(err.error?.message || 'Error deleting stage');
      },
    });
  }

  closeStageModal() {
    this.showStageModal.set(false);
    this.editingStage.set(null);
    this.stageForm = { name: '', color: '#6b7280' };
  }

  saveStage() {
    const sprint = this.sprintsService.currentSprint();
    if (!sprint) return;

    const editing = this.editingStage();
    if (editing) {
      this.sprintsService.updateStage(editing.id, this.stageForm).subscribe({
        next: () => this.closeStageModal(),
        error: (err) => this.errorMessage.set(err.error?.message || 'Error updating stage'),
      });
    } else {
      this.sprintsService.createStage(sprint.id, this.stageForm).subscribe({
        next: () => this.closeStageModal(),
        error: (err) => this.errorMessage.set(err.error?.message || 'Error creating stage'),
      });
    }
  }

  // ===== TICKET OPERATIONS =====

  openNewTicketModal(stage: Stage) {
    this.selectedStage.set(stage);
    this.editingTicket.set(null);
    this.ticketForm = {
      title: '',
      description: '',
      stageId: stage.id,
      type: 'TASK',
      priority: 'MEDIUM',
      dueDate: '',
      estimatedHours: null,
      tagId: null,
      assigneeId: null,
    };
    this.showTicketModal.set(true);
  }

  openTicketModal(ticket: Ticket) {
    this.editingTicket.set(ticket);
    this.ticketForm = {
      title: ticket.title,
      description: ticket.description || '',
      stageId: ticket.stageId,
      type: ticket.type || 'TASK',
      priority: ticket.priority,
      dueDate: ticket.dueDate ? ticket.dueDate.split('T')[0] : '',
      estimatedHours: ticket.estimatedHours || null,
      tagId: ticket.tagId || null,
      assigneeId: ticket.assigneeId || null,
    };
    this.showTicketModal.set(true);
  }

  closeTicketModal() {
    this.showTicketModal.set(false);
    this.editingTicket.set(null);
    this.selectedStage.set(null);
  }

  saveTicket() {
    const editing = this.editingTicket();
    const payload = {
      ...this.ticketForm,
      dueDate: this.ticketForm.dueDate || undefined,
      tagId: this.ticketForm.tagId || undefined,
      assigneeId: this.ticketForm.assigneeId || undefined,
      estimatedHours: this.ticketForm.estimatedHours ? Number(this.ticketForm.estimatedHours) : undefined,
    };

    if (editing) {
      this.ticketsService.update(editing.id, payload).subscribe({
        next: () => {
          this.reloadSprint();
          this.closeTicketModal();
        },
        error: (err) => this.errorMessage.set(err.error?.message || 'Error updating ticket'),
      });
    } else {
      this.ticketsService.create(payload).subscribe({
        next: () => {
          this.reloadSprint();
          this.closeTicketModal();
        },
        error: (err) => this.errorMessage.set(err.error?.message || 'Error creating ticket'),
      });
    }
  }

  deleteTicket() {
    const ticket = this.editingTicket();
    if (!ticket) return;
    this.ticketToDelete.set(ticket);
  }

  confirmDeleteTicket() {
    const ticket = this.ticketToDelete();
    if (!ticket) return;
    this.ticketsService.delete(ticket.id).subscribe({
      next: () => {
        this.ticketToDelete.set(null);
        this.reloadSprint();
        this.closeTicketModal();
      },
      error: (err) => {
        this.ticketToDelete.set(null);
        this.errorMessage.set(err.error?.message || 'Error deleting ticket');
      },
    });
  }

  // ===== TAG OPERATIONS =====

  openTagManager() {
    this.showTagModal.set(true);
    this.editingTag.set(null);
    this.tagForm = { name: '', color: '#6b7280' };
  }

  closeTagManager() {
    this.showTagModal.set(false);
    this.editingTag.set(null);
    this.tagForm = { name: '', color: '#6b7280' };
  }

  editTagStart(tag: Tag) {
    this.editingTag.set(tag);
    this.tagForm = { name: tag.name, color: tag.color };
  }

  cancelEditTag() {
    this.editingTag.set(null);
    this.tagForm = { name: '', color: '#6b7280' };
  }

  saveTag() {
    const sprint = this.sprintsService.currentSprint();
    if (!sprint || !this.tagForm.name) return;

    const editing = this.editingTag();
    if (editing) {
      this.tagsService.update(editing.id, this.tagForm).subscribe({
        next: (updatedTag) => {
          this.sprintsService.updateTicketTags(editing.id, updatedTag);
          this.cancelEditTag();
        },
        error: (err) => this.errorMessage.set(err.error?.message || 'Error updating tag'),
      });
    } else {
      this.tagsService.create({
        ...this.tagForm,
        workspaceId: sprint.workspaceId,
      }).subscribe({
        next: () => {
          this.tagForm = { name: '', color: '#6b7280' };
        },
        error: (err) => this.errorMessage.set(err.error?.message || 'Error creating tag'),
      });
    }
  }

  deleteTag(tag: Tag) {
    this.showTagModal.set(false);
    this.tagDeleteWarning.set(null);
    this.tagToDelete.set(tag);
  }

  confirmDeleteTag() {
    const tag = this.tagToDelete();
    if (!tag) return;

    const force = !!this.tagDeleteWarning();

    this.tagsService.delete(tag.id, force).subscribe({
      next: () => {
        this.sprintsService.removeTicketTags(tag.id);
        this.tagToDelete.set(null);
        this.tagDeleteWarning.set(null);
        this.showTagModal.set(true);
      },
      error: (err) => {
        if (err.status === 409 && err.error?.requiresConfirmation) {
          this.tagDeleteWarning.set(err.error.message);
        } else {
          this.tagToDelete.set(null);
          this.tagDeleteWarning.set(null);
          this.showTagModal.set(true);
          this.errorMessage.set(err.error?.message || 'Error deleting tag');
        }
      },
    });
  }

  cancelDeleteTag() {
    this.tagToDelete.set(null);
    this.tagDeleteWarning.set(null);
    this.showTagModal.set(true);
  }

  // ===== DRAG & DROP =====

  onTicketDrop(event: CdkDragDrop<Ticket[]>, targetStage: Stage) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const ticket = event.container.data[event.currentIndex];
    this.ticketsService.move(ticket.id, {
      stageId: targetStage.id,
      position: event.currentIndex,
    }).subscribe();
  }

  // ===== HELPERS =====

  reloadSprint() {
    const sprint = this.sprintsService.currentSprint();
    if (sprint) {
      this.sprintsService.get(sprint.id).subscribe();
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  isDueSoon(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 2 && days >= 0;
  }

}
